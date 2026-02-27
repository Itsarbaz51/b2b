import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { CryptoService } from "../utils/cryptoService.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";
import { TestingAPI } from "./testing/testingAPIs.js";
import AuditLogService from "./auditLog.service.js";

export class ServiceProviderService {
  static async create(payload, files, req = null, res = null) {
    const {
      code,
      name,
      description,
      isActive,
      apiIntegrationStatus = false,
      parentId = null,
      keyValueInputNumber = 0,
    } = payload;

    let uploaded = null;
    let currentUserId = req?.user?.id;

    try {
      // Validate required fields
      if (!code || !name) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "SERVICE_CREATION_FAILED",
          entityType: "SERVICE",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "MISSING_REQUIRED_FIELDS",
            providedCode: code,
            providedName: name,
            createdBy: currentUserId,
          },
        });
        throw ApiError.badRequest("Code and name are required", 400);
      }

      // Check if code already exists
      const existingCode = await Prisma.serviceProvider.findUnique({
        where: { code },
      });

      if (existingCode) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "SERVICE_CREATION_FAILED",
          entityType: "SERVICE",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "SERVICE_CODE_EXISTS",
            serviceCode: code,
            createdBy: currentUserId,
          },
        });
        throw ApiError.conflict("Service Provider code already exists", 400);
      }

      let hierarchyLevel = "";
      let hierarchyPath = "";

      if (parentId) {
        // ---- If has parent ----
        const parent = await Prisma.serviceProvider.findUnique({
          where: { id: parentId },
        });

        if (!parent) {
          await AuditLogService.createAuditLog({
            userId: currentUserId,
            action: "SERVICE_CREATION_FAILED",
            entityType: "SERVICE",
            ipAddress: req ? Helper.getClientIP(req) : null,
            metadata: {
              ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
              reason: "PARENT_NOT_FOUND",
              parentId: parentId,
              createdBy: currentUserId,
            },
          });
          throw ApiError.notFound("Parent service provider not found", 404);
        }

        if (parent.parentId === null && !this.isValidRootParent(parent)) {
          await AuditLogService.createAuditLog({
            userId: currentUserId,
            action: "SERVICE_CREATION_FAILED",
            entityType: "SERVICE",
            ipAddress: req ? Helper.getClientIP(req) : null,
            metadata: {
              ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
              reason: "INVALID_PARENT_HIERARCHY",
              parentId: parentId,
              createdBy: currentUserId,
            },
          });
          throw ApiError.badRequest("Invalid parent hierarchy", 400);
        }

        // Get siblings count for the next position
        const siblingCount = await Prisma.serviceProvider.count({
          where: { parentId },
        });

        const nextPosition = siblingCount + 1;

        // Build hierarchy level (shorter, for display)
        hierarchyLevel = `${parent.hierarchyLevel}.${nextPosition}`;

        // Build hierarchy path (full path for querying)
        hierarchyPath = `${parent.hierarchyPath}/${nextPosition}`;
      } else {
        // ---- Root-level ----
        const rootCount = await Prisma.serviceProvider.count({
          where: { parentId: null },
        });

        const nextPosition = rootCount + 1;

        // For root elements, level and path are the same
        hierarchyLevel = `${nextPosition}`;
        hierarchyPath = `${nextPosition}`;
      }

      // Validate hierarchy values
      if (!hierarchyLevel || !hierarchyPath) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "SERVICE_CREATION_FAILED",
          entityType: "SERVICE",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "HIERARCHY_GENERATION_FAILED",
            createdBy: currentUserId,
          },
        });
        throw ApiError.internal("Failed to generate hierarchy data", 500);
      }

      //  Safe image upload (optional)
      const iconFile = files?.icon?.[0];
      if (iconFile?.path) {
        try {
          uploaded = await S3Service.upload(iconFile.path, "services");
        } catch (uploadError) {
          await AuditLogService.createAuditLog({
            userId: currentUserId,
            action: "SERVICE_CREATION_FAILED",
            entityType: "SERVICE",
            ipAddress: req ? Helper.getClientIP(req) : null,
            metadata: {
              ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
              reason: "ICON_UPLOAD_FAILED",
              createdBy: currentUserId,
            },
          });
          console.error(" Failed to upload icon:", uploadError);
          throw ApiError.internal("Failed to upload service icon", 500);
        }
      }

      const createData = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description ? description.trim() : null,
        iconUrl: uploaded,
        isActive: isActive ?? false,
        apiIntegrationStatus: apiIntegrationStatus ?? false,
        hierarchyLevel,
        hierarchyPath,
        parentId,
        keyValueInputNumber: this.sanitizeKeyValueInput(keyValueInputNumber),
      };

      const serviceProvider = await Prisma.serviceProvider.create({
        data: createData,
        include: {
          parent: {
            select: {
              id: true,
              code: true,
              name: true,
              hierarchyLevel: true,
              hierarchyPath: true,
            },
          },
          subService: {
            select: {
              id: true,
              code: true,
              name: true,
              hierarchyLevel: true,
            },
          },
        },
      });

      // Audit log for successful service creation
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "SERVICE_CREATED",
        entityType: "SERVICE",
        entityId: serviceProvider.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          serviceName: serviceProvider.name,
          serviceCode: serviceProvider.code,
          isActive: serviceProvider.isActive,
          apiIntegrationStatus: serviceProvider.apiIntegrationStatus,
          parentId: serviceProvider.parentId,
          hierarchyLevel: serviceProvider.hierarchyLevel,
          createdBy: currentUserId,
        },
      });

      return serviceProvider;
    } catch (error) {
      // Clean up uploaded file if creation fails
      if (uploaded) {
        try {
          await S3Service.delete(uploaded);
        } catch (cleanupError) {
          console.error("Failed to clean up uploaded file:", cleanupError);
        }
      }

      // Handle specific Prisma errors
      if (error.code === "P2002") {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "SERVICE_CREATION_FAILED",
          entityType: "SERVICE",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "SERVICE_CODE_EXISTS_PRISMA",
            createdBy: currentUserId,
          },
        });
        throw ApiError.conflict("Service Provider code already exists", 400);
      } else if (error.code === "P2003") {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "SERVICE_CREATION_FAILED",
          entityType: "SERVICE",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "INVALID_PARENT_REFERENCE",
            createdBy: currentUserId,
          },
        });
        throw ApiError.badRequest("Invalid parent reference", 400);
      }

      // Re-throw if it's already an ApiError
      if (error instanceof ApiError) {
        throw error;
      }

      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "SERVICE_CREATION_FAILED",
        entityType: "SERVICE",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "UNKNOWN_ERROR",
          error: error.message,
          createdBy: currentUserId,
        },
      });
      throw ApiError.internal("Failed to create service provider", 500);
    } finally {
      // Clean up temporary files
      if (files?.icon?.[0]?.path) {
        try {
          await Helper.deleteOldImage(files.icon);
        } catch (fileError) {
          console.error("❌ Failed to clean up temporary files:", fileError);
        }
      }
    }
  }

  static isValidRootParent(parent) {
    // Validate that root parents have consistent hierarchy
    return (
      parent.hierarchyLevel === parent.hierarchyPath &&
      !parent.hierarchyLevel.includes("/") &&
      !parent.hierarchyLevel.includes(".")
    );
  }

  static sanitizeKeyValueInput(input) {
    if (input === undefined || input === null) return "0";

    const num = parseInt(input);
    return isNaN(num) || num < 0 ? "0" : num.toString();
  }

  static validateHierarchyPath(path) {
    if (!path || typeof path !== "string") return false;

    const pathRegex = /^(\d+)(\/\d+)*$/;
    return pathRegex.test(path);
  }

  static async getHierarchyTree(req = null, res = null) {
    let currentUserId = req.user.id;

    const allServices = await Prisma.serviceProvider.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        hierarchyLevel: true,
        hierarchyPath: true,
        parentId: true,
      },
      orderBy: { hierarchyPath: "asc" },
    });

    // Audit log for hierarchy tree retrieval
    await AuditLogService.createAuditLog({
      userId: currentUserId,
      action: "SERVICE_HIERARCHY_RETRIEVED",
      entityType: "SERVICE",
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
        totalServices: allServices.length,
        retrievedBy: currentUserId,
      },
    });

    return allServices;
  }

  // Get all services api intigration
  static async getAll() {
    try {
      const allServiceProviders = await Prisma.serviceProvider.findMany({
        where: { parentId: null, code: { not: "BANK_TRANSFER" } },
        include: {
          subService: {
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      if (!allServiceProviders || allServiceProviders.length === 0) {
        throw ApiError.notFound("Services not found");
      }

      const allApiIntigration = await Promise.all(
        allServiceProviders.map(async (service) => {
          try {
            let decryptedEnvConfig = [];

            if (service.envConfig && Array.isArray(service.envConfig)) {
              decryptedEnvConfig = await Promise.all(
                service.envConfig.map(async (env) => {
                  try {
                    const decryptedValue = CryptoService.decrypt(env.value);
                    return {
                      key: env.key,
                      value: decryptedValue,
                    };
                  } catch (envError) {
                    return {
                      key: env.key,
                      value: `[DECRYPTION_FAILED]`,
                      _error: true,
                    };
                  }
                })
              );
            }

            return {
              id: service.id,
              name: service.name,
              code: service.code,
              apiIntegrationStatus: service.apiIntegrationStatus,
              envConfig: decryptedEnvConfig,
              keyValueInputNumber: service.keyValueInputNumber,
              subService: service.subService.map((sub) => ({
                id: sub.id,
                name: sub.name,
                code: sub.code,
                apiIntegrationStatus: sub.apiIntegrationStatus,
              })),
            };
          } catch (serviceError) {
            return {
              id: service.id,
              name: service.name,
              code: service.code,
              apiIntegrationStatus: service.apiIntegrationStatus,
              keyValueInputNumber: service.keyValueInputNumber,
              envConfig: service.envConfig || [],
              subService: service.subService.map((sub) => ({
                id: sub.id,
                name: sub.name,
                code: sub.code,
                apiIntegrationStatus: sub.apiIntegrationStatus,
              })),
              _processingError: true,
            };
          }
        })
      );

      return {
        allApiIntigration,
        count: allApiIntigration.length,
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal("Failed to fetch services");
    }
  }

  // Get only active services
  static async getActive() {
    try {
      const activeServices = await Prisma.serviceProvider.findMany({
        where: {
          parentId: null,
          isActive: true,
        },
        include: {
          subService: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      });

      // Agar koi active service nahi hai toh empty array return karo
      if (!activeServices || activeServices.length === 0) {
        return {
          allActiveServices: [],
          count: 0,
        };
      }

      const allActiveServices = activeServices.map((service) => ({
        id: service.id,
        name: service.name,
        code: service.code,
        isActive: service.isActive,
        subService: service.subService.map((sub) => ({
          id: sub.id,
          name: sub.name,
          code: sub.code,
          isActive: sub.isActive,
        })),
      }));

      return {
        allActiveServices,
        count: allActiveServices.length,
      };
    } catch (error) {
      throw ApiError.internal("Failed to fetch active services");
    }
  }

  // Get only active services
  static async allServices() {
    try {
      const services = await Prisma.serviceProvider.findMany({
        where: { parentId: null },
        include: {
          subService: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      const allServices = services
        .filter((service) => {
          const hasSubServices =
            Array.isArray(service.subService) && service.subService.length > 0;

          if (hasSubServices) {
            // Agar subServices hain toh check karo koi bhi active ho
            return (
              service.apiIntegrationStatus === true ||
              service.subService.some(
                (sub) => sub.apiIntegrationStatus === true
              )
            );
          } else {
            // Agar subServices nahi hain toh sirf main service check karo
            return service.apiIntegrationStatus === true;
          }
        })
        .map((service) => ({
          id: service.id,
          name: service.name,
          code: service.code,
          isActive: service.isActive,
          apiIntegrationStatus: service.apiIntegrationStatus,
          subService: service.subService.map((sub) => ({
            id: sub.id,
            name: sub.name,
            code: sub.code,
            isActive: sub.apiIntegrationStatus,
          })),
        }));

      return allServices;
    } catch (error) {
      throw ApiError.internal("Failed to fetch allServices services", error);
    }
  }

  // Update environment configuration
  static async updateEnvConfig(id, data, req = null, res = null) {
    let currentUserId = req.user.id;
    try {
      const existing = await Prisma.serviceProvider.findUnique({
        where: { id },
        include: { subService: true },
      });

      if (!existing) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "SERVICE_ENV_CONFIG_UPDATE_FAILED",
          entityType: "SERVICE",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "SERVICE_NOT_FOUND",
            roleName: req.user.role,
            updatedBy: currentUserId,
          },
        });
        throw ApiError.notFound("Service Provider not found");
      }

      const updateData = {
        updatedAt: new Date(),
        envConfig: [],
      };

      if (data.envConfig && Array.isArray(data.envConfig)) {
        const validEnvs = data.envConfig.filter(
          (env) => env.key && env.key.trim() && env.value && env.value.trim()
        );

        if (validEnvs.length > 0) {
          const encryptedEnvConfig = validEnvs.map((env) => ({
            key: env.key.trim(),
            value: CryptoService.encrypt(env.value.trim()),
          }));

          updateData.apiIntegrationStatus = true;
          updateData.isActive = true;
          updateData.envConfig = encryptedEnvConfig;
        } else {
          updateData.apiIntegrationStatus = false;
          updateData.isActive = false;
        }
      } else {
        updateData.apiIntegrationStatus = false;
        updateData.isActive = false;
      }

      if (data.subServices && Array.isArray(data.subServices)) {
        for (const subService of data.subServices) {
          try {
            await Prisma.serviceProvider.update({
              where: { id: subService.id },
              data: {
                apiIntegrationStatus: subService.apiIntegrationStatus || false,
                updatedAt: new Date(),
              },
            });
          } catch (error) {
            // Continue with other sub-services even if one fails
          }
        }
      }

      const updated = await Prisma.serviceProvider.update({
        where: { id },
        data: updateData,
        include: {
          subService: {
            select: {
              id: true,
              name: true,
              code: true,
              apiIntegrationStatus: true,
              isActive: true,
            },
          },
        },
      });

      // Audit log for successful environment config update
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "SERVICE_ENV_CONFIG_UPDATED",
        entityType: "SERVICE",
        entityId: id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          serviceName: updated.name,
          roleName: req.user.role,
          serviceCode: updated.code,
          envConfigCount: updateData.envConfig.length,
          apiIntegrationStatus: updated.apiIntegrationStatus,
          updatedSubServices: data.subServices?.length || 0,
          updatedBy: currentUserId,
        },
      });

      return updated;
    } catch (error) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "SERVICE_ENV_CONFIG_UPDATE_FAILED",
        entityType: "SERVICE",
        entityId: id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "UPDATE_ERROR",
          roleName: req.user.role,
          error: error.message,
          updatedBy: currentUserId,
        },
      });
      throw ApiError.internal(
        `Failed to update environment config: ${error.message}`
      );
    }
  }

  // only service status change
  static async toggleServiceStatus(id, req = null, res = null) {
    let currentUserId = req.user.id;

    try {
      // 1. Pehle service find karo
      const existing = await Prisma.serviceProvider.findUnique({
        where: { id },
        include: {
          parent: true, // Parent service (agar child hai toh)
          subService: true, // Sub-services (agar parent hai toh)
        },
      });

      if (!existing) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "SERVICE_STATUS_TOGGLE_FAILED",
          entityType: "SERVICE",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "SERVICE_NOT_FOUND",
            roleName: req.user.role,
            toggledBy: currentUserId,
          },
        });
        throw ApiError.notFound("Service not found");
      }

      // 2. Current status ko toggle karo (true -> false, false -> true)
      const newStatus = !existing.isActive;

      // 3. Agar service ke sub-services hain AUR newStatus false hai
      if (existing.subService.length > 0 && !newStatus) {
        // To main service + sabhi sub-services ko disable karo
        await Prisma.serviceProvider.updateMany({
          where: {
            OR: [{ id }, { parentId: id }], // Main service + uske sabhi children
          },
          data: {
            isActive: false, // Sabko false karo
            updatedAt: new Date(),
          },
        });

        // ✅ NEW: Sub-services ke user permissions bhi disable karo
        const subServiceIds = existing.subService.map((sub) => sub.id);
        const allServiceIdsToDisable = [id, ...subServiceIds];

        const disabledPermissionsCount = await Prisma.userPermission.updateMany(
          {
            where: {
              serviceId: { in: allServiceIdsToDisable },
              canView: true,
            },
            data: {
              canView: false,
            },
          }
        );

        // Updated service return karo
        const updatedService = await Prisma.serviceProvider.findUnique({
          where: { id },
          include: {
            subService: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
        });

        // Audit log for service status toggle with sub-services
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "SERVICE_STATUS_TOGGLED",
          entityType: "SERVICE",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            serviceName: existing.name,
            previousStatus: existing.isActive,
            roleName: req.user.role,
            newStatus: newStatus,
            subServicesAffected: existing.subService.length,
            permissionsDisabled: disabledPermissionsCount.count,
            servicesDisabled: allServiceIdsToDisable,
            toggledBy: currentUserId,
          },
        });

        return updatedService;
      }

      // 4. Agar service child hai AUR uska parent disabled hai AUR hum enable karna chahte hain
      if (existing.parentId && !existing.parent.isActive && newStatus) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "SERVICE_STATUS_TOGGLE_FAILED",
          entityType: "SERVICE",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "PARENT_DISABLED",
            serviceName: existing.name,
            parentName: existing.parent.name,
            roleName: req.user.role,
            toggledBy: currentUserId,
          },
        });
        throw ApiError.badRequest(
          `Cannot enable "${existing.name}" - parent "${existing.parent.name}" is disabled`
        );
      }

      // 5. Normal case - sirf current service ki status toggle karo
      const updated = await Prisma.serviceProvider.update({
        where: { id },
        data: {
          isActive: newStatus,
          updatedAt: new Date(),
        },
      });

      if (!updated) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "SERVICE_STATUS_TOGGLE_FAILED",
          entityType: "SERVICE",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "DATABASE_UPDATE_FAILED",
            roleName: req.user.role,
            toggledBy: currentUserId,
          },
        });
        throw ApiError.internal("Failed to change active/inactive status");
      }

      // ✅ NEW: Agar service disable ho rahi hai to user permissions update karo
      let disabledPermissionsCount = 0;
      if (!newStatus) {
        const result = await Prisma.userPermission.updateMany({
          where: {
            serviceId: id,
            canView: true,
          },
          data: {
            canView: false,
          },
        });
        disabledPermissionsCount = result.count;
      }

      // Audit log for successful service status toggle
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "SERVICE_STATUS_TOGGLED",
        entityType: "SERVICE",
        entityId: id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          serviceName: existing.name,
          previousStatus: existing.isActive,
          roleName: req.user.role,
          newStatus: newStatus,
          permissionsDisabled: disabledPermissionsCount,
          toggledBy: currentUserId,
        },
      });

      return updated;
    } catch (error) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "SERVICE_STATUS_TOGGLE_FAILED",
        entityType: "SERVICE",
        entityId: id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "UNKNOWN_ERROR",
          error: error.message,
          roleName: req.user.role,
          toggledBy: currentUserId,
        },
      });
      throw ApiError.internal(
        `Failed to toggle service status: ${error.message}`
      );
    }
  }

  // only api intigration status change
  static async toggleApiIntigrationStatus(id, req = null, res = null) {
    let currentUserId = req.user.id;

    try {
      const existing = await Prisma.serviceProvider.findUnique({
        where: { id },
        include: {
          parent: true,
          subService: true,
        },
      });

      if (!existing) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "SERVICE_API_STATUS_TOGGLE_FAILED",
          entityType: "SERVICE",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "SERVICE_NOT_FOUND",
            roleName: req.user.role,
            toggledBy: currentUserId,
          },
        });
        throw ApiError.notFound("Service not found");
      }

      const newStatus = !existing.isActive;
      const newApiStatus = !existing.apiIntegrationStatus;

      if (existing.subService.length > 0 && !newStatus && !newApiStatus) {
        await Prisma.serviceProvider.updateMany({
          where: {
            OR: [{ id }, { parentId: id }],
          },
          data: {
            isActive: false,
            apiIntegrationStatus: false,
            updatedAt: new Date(),
          },
        });

        const updatedService = await Prisma.serviceProvider.findUnique({
          where: { id },
          include: {
            subService: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
        });

        // Audit log for API status toggle with sub-services
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "SERVICE_API_STATUS_TOGGLED",
          entityType: "SERVICE",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            serviceName: existing.name,
            roleName: req.user.role,
            previousApiStatus: existing.apiIntegrationStatus,
            newApiStatus: newApiStatus,
            subServicesAffected: existing.subService.length,
            toggledBy: currentUserId,
          },
        });

        return updatedService;
      }

      if (
        existing.parentId &&
        !existing.parent.isActive &&
        newStatus &&
        newApiStatus
      ) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "SERVICE_API_STATUS_TOGGLE_FAILED",
          entityType: "SERVICE",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "PARENT_DISABLED",
            serviceName: existing.name,
            roleName: req.user.role,
            parentName: existing.parent.name,
            toggledBy: currentUserId,
          },
        });
        throw ApiError.badRequest(
          `Cannot enable "${existing.name}" - parent "${existing.parent.name}" is disabled`
        );
      }

      const updated = await Prisma.serviceProvider.update({
        where: { id },
        data: {
          isActive: newStatus,
          apiIntegrationStatus: newApiStatus,
          updatedAt: new Date(),
        },
      });

      if (!updated) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "SERVICE_API_STATUS_TOGGLE_FAILED",
          entityType: "SERVICE",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "DATABASE_UPDATE_FAILED",
            roleName: req.user.role,
            toggledBy: currentUserId,
          },
        });
        throw ApiError.internal("Failed to change active/inactive status");
      }

      // Audit log for successful API status toggle
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "SERVICE_API_STATUS_TOGGLED",
        entityType: "SERVICE",
        entityId: id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          serviceName: existing.name,
          roleName: req.user.role,
          previousApiStatus: existing.apiIntegrationStatus,
          newApiStatus: newApiStatus,
          toggledBy: currentUserId,
        },
      });

      return updated;
    } catch (error) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "SERVICE_API_STATUS_TOGGLE_FAILED",
        entityType: "SERVICE",
        entityId: id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "UNKNOWN_ERROR",
          roleName: req.user.role,
          error: error.message,
          toggledBy: currentUserId,
        },
      });
      throw ApiError.internal(
        `Failed to toggle service status: ${error.message}`
      );
    }
  }

  // Test API connection
  static async testApiConnection(
    serviceProviderId,
    envConfig,
    req = null,
    res = null
  ) {
    let currentUserId = req.user.id;

    const serviceProvider = await Prisma.serviceProvider.findUnique({
      where: { id: serviceProviderId },
    });

    if (!serviceProvider) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "API_CONNECTION_TEST_FAILED",
        entityType: "SERVICE",
        entityId: serviceProviderId,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "SERVICE_NOT_FOUND",
          roleName: req.user.role,
          testedBy: currentUserId,
        },
      });
      throw new ApiError.notFound("Service Provider not found");
    }

    if (envConfig.length !== Number(serviceProvider.keyValueInputNumber)) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "API_CONNECTION_TEST_FAILED",
        entityType: "SERVICE",
        entityId: serviceProviderId,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "INVALID_ENV_CONFIG_COUNT",
          roleName: req.user.role,
          requiredFields: serviceProvider.keyValueInputNumber,
          providedFields: envConfig.length,
          testedBy: currentUserId,
        },
      });
      throw ApiError.badRequest(
        `${serviceProvider.keyValueInputNumber} Numbers of Filed are required`
      );
    }

    const testResult = await this.performConnectionTest(
      serviceProvider.code,
      envConfig
    );

    // Audit log for API connection test
    await AuditLogService.createAuditLog({
      userId: currentUserId,
      action: "API_CONNECTION_TESTED",
      entityType: "SERVICE",
      entityId: serviceProviderId,
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
        serviceName: serviceProvider.name,
        serviceCode: serviceProvider.code,
        testSuccess: testResult.success,
        testMessage: testResult.message,
        testedBy: currentUserId,
      },
    });

    return testResult;
  }

  // Perform actual connection test based on service type
  static async performConnectionTest(serviceCode, envConfig) {
    const serviceTests = {
      RAZORPAY: this.testRazorpayConnection,
      AEPS: this.testAepsConnection,
      BBPS: this.testBbpsConnection,
      DMT: this.testDmtConnection,
      RECHARGE: this.testRechargeConnection,
      CC_PAYOUT: this.testCcPayoutConnection,
    };

    const testFunction =
      serviceTests[serviceCode] || this.testGenericConnection;
    return testFunction(envConfig);
  }

  static async testRazorpayConnection(envConfig) {
    const apiKeyEnv = envConfig.find((env) => env.key === "RAZORPAY_KEY_ID");
    const apiSecretEnv = envConfig.find(
      (env) => env.key === "RAZORPAY_KEY_SECRET"
    );

    if (!apiKeyEnv?.value) {
      throw ApiError.badRequest("Missing Razorpay API Key");
    }
    if (!apiSecretEnv?.value) {
      throw ApiError.badRequest("Missing Razorpay API Secret");
    }

    const apiKey = apiKeyEnv.value.trim();
    const apiSecret = apiSecretEnv.value.trim();

    const result = await TestingAPI.razorpay({ apiKey, apiSecret });
    return result;
  }

  static async testAepsConnection(envConfig) {
    // Mock AEPS connection test
    const hasRequiredFields = envConfig.some(
      (env) => env.key && env.key.includes("aadhaar") && env.value
    );

    return {
      success: hasRequiredFields,
      message: hasRequiredFields
        ? "AEPS connection test successful"
        : "Missing Aadhaar configuration",
    };
  }

  static async testBbpsConnection(envConfig) {
    // Mock BBPS connection test
    const hasApiKeys = envConfig.some(
      (env) =>
        env.key &&
        (env.key.includes("api") || env.key.includes("key")) &&
        env.value
    );

    return {
      success: hasApiKeys,
      message: hasApiKeys
        ? "BBPS connection test successful"
        : "Missing API keys for BBPS",
    };
  }

  static async testGenericConnection(envConfig) {
    // Generic connection test
    const hasValidConfig =
      envConfig.length > 0 && envConfig.every((env) => env.key && env.value);

    return {
      success: hasValidConfig,
      message: hasValidConfig
        ? "Connection test successful"
        : "Invalid environment configuration",
    };
  }
}
