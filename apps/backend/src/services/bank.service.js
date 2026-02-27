import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";
import AuditLogService from "./auditLog.service.js";

export class BankDetailService {
  // ================= BANK DETAILS =================
  static async getAllChildrenIds(userId) {
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        children: {
          select: { id: true, children: { select: { id: true } } },
        },
      },
    });

    if (!user || !user.children?.length) return [];

    let allChildIds = [];

    const getDescendants = async (parentId) => {
      const children = await Prisma.user.findMany({
        where: { parentId },
        select: { id: true },
      });

      if (!children.length) return [];

      const childIds = children.map((child) => child.id);
      let descendantIds = [...childIds];

      for (const childId of childIds) {
        const grandchildren = await getDescendants(childId);
        descendantIds.push(...grandchildren);
      }

      return descendantIds;
    };

    allChildIds = await getDescendants(userId);
    return allChildIds;
  }

  static async index(params) {
    const {
      userId,
      role,
      status,
      page = 1,
      limit = 10,
      sort = "desc",
      search,
    } = params;

    const user = await Prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = sort === "asc" ? "asc" : "desc";

    let where = {};

    // Modified logic: ADMIN aur EMPLOYEE ko saare banks dikhao (excluding ADMIN's own banks)
    if (user.role.name === "ADMIN" || user.role.type === "employee") {
      where.userId = { not: userId }; // Don't show admin's own banks
      where.user = {
        role: { is: { name: { not: "ADMIN" } } }, // Don't show other admin users' banks
      };
    } else {
      // Other users ke liye sirf apne children ke banks
      const childIds = await this.getAllChildrenIds(userId);
      if (!childIds.length) {
        return {
          banks: [],
          meta: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
        };
      }
      where.userId = { in: childIds };
    }

    if (status && status !== "ALL") where.status = status;
    if (search && search.trim() !== "") {
      const searchTerm = search.trim();
      where.OR = [
        { accountNumber: { contains: searchTerm } },
        { bankName: { contains: searchTerm } },
      ];
    }

    const banks = await Prisma.bankDetail.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sortOrder },
      include: {
        user: { include: { role: true } },
      },
    });

    const total = await Prisma.bankDetail.count({ where });

    const result = {
      banks,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        userRole: user.role.name,
        userRoleType: user.role.type,
        isEmployeeViewingAllData: user.role.type === "employee",
      },
    };

    return result;
  }

  static async getAllMy(userId) {
    const user = await Prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            level: true,
            type: true,
            description: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    const userRoleType = user.role.type;
    let targetUserId = userId;

    if (userRoleType === "employee") {
      const adminUser = await Prisma.user.findFirst({
        where: {
          role: {
            name: "ADMIN",
          },
        },
      });

      if (!adminUser) {
        throw new Error("Admin user not found");
      }

      targetUserId = adminUser.id;
    }

    const records = await Prisma.bankDetail.findMany({
      where: { userId: targetUserId },
    });

    if (!records || records.length === 0) return null;

    const safely = await Helper.serializeUser(records);
    return safely;
  }

  static async show(id, userId, req = null, res) {
    const user = await Prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.unauthorized("User not found");
    }

    const record = await Prisma.bankDetail.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!record) {
      // Audit log for bank detail not found
      if (req) {
        await AuditLogService.createAuditLog({
          userId: userId,
          action: "BANK_DETAIL_RETRIEVAL_FAILED",
          entityType: "BANK",
          entityId: id,
          ipAddress: Helper.getClientIP(req),
          metadata: {
            ...Helper.generateCommonMetadata(req, res),
            roleType: user.role.type,
            roleName: user.role.name,
            reason: "BANK_NOT_FOUND",
          },
        });
      }
      throw ApiError.notFound("Bank detail not found");
    }

    // Audit log for successful bank detail retrieval
    if (req) {
      await AuditLogService.createAuditLog({
        userId: userId,
        action: "BANK_DETAIL_RETRIEVED",
        entityType: "BANK",
        entityId: id,
        ipAddress: Helper.getClientIP(req),
        metadata: {
          ...Helper.generateCommonMetadata(req, res),
          roleType: user.role.type,
          roleName: user.role.name,
          bankOwnerId: record.userId,
          bankStatus: record.status,
          accountNumber: record.accountNumber?.substring(0, 3) + "***",
        },
      });
    }

    const safely = await Helper.serializeUser(record);
    return safely;
  }

  static async store(payload, req = null, res = null) {
    const { bankProofFile, ...rest } = payload;
    let proofUrl;
    try {
      const userExists = await Prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          role: {
            select: {
              type: true,
              name: true,
            },
          },
        },
      });

      if (!userExists) {
        if (req) {
          await AuditLogService.createAuditLog({
            userId: payload.userId,
            action: "BANK_CREATION_FAILED",
            entityType: "BANK",
            entityId: req.user?.id,
            ipAddress: Helper.getClientIP(req),
            metadata: {
              ...Helper.generateCommonMetadata(req, res),
              reason: "USER_NOT_FOUND",
            },
          });
        }
        throw ApiError.notFound("User not found");
      }

      const userRoleType = userExists.role.type;
      let targetUserId = payload.userId;

      if (userRoleType === "employee") {
        const adminUser = await Prisma.user.findFirst({
          where: {
            role: {
              name: "ADMIN",
            },
          },
        });

        if (!adminUser) {
          throw new Error("Admin user not found");
        }
        targetUserId = adminUser.id;
      }

      const exists = await Prisma.bankDetail.findFirst({
        where: {
          accountNumber: rest.accountNumber,
          userId: targetUserId,
        },
      });

      if (exists) {
        if (req) {
          await AuditLogService.createAuditLog({
            userId: payload.userId,
            action: "BANK_CREATION_FAILED",
            entityType: "BANK",
            entityId: exists.id,
            ipAddress: Helper.getClientIP(req),
            metadata: {
              ...Helper.generateCommonMetadata(req, res),
              roleType: userExists.role.type,
              roleName: userExists.role.name,
              reason: "DUPLICATE_ACCOUNT_NUMBER",
              accountNumber: rest.accountNumber,
              targetUserId: targetUserId,
            },
          });
        }
        throw ApiError.conflict("This account number already exists");
      }

      if (bankProofFile) {
        proofUrl = await S3Service.upload(bankProofFile.path, "bankdoc");
      }

      if (!proofUrl) {
        // Audit log for proof upload failure
        if (req) {
          await AuditLogService.createAuditLog({
            userId: payload.userId,
            action: "BANK_CREATION_FAILED",
            entityType: "BANK",
            entityId: null,
            ipAddress: Helper.getClientIP(req),
            metadata: {
              ...Helper.generateCommonMetadata(req, res),
              roleType: userExists.role.type,
              roleName: userExists.role.name,
              reason: "PROOF_UPLOAD_FAILED",
              targetUserId: targetUserId,
            },
          });
        }
        throw ApiError.internal("Proof upload failed");
      }

      if (payload.isPrimary) {
        await Prisma.bankDetail.updateMany({
          where: { userId: targetUserId },
          data: { isPrimary: false },
        });
      }

      let status = "PENDING";

      if (
        userExists.role.name === "ADMIN" ||
        userExists.role.type === "employee"
      ) {
        status = "VERIFIED";
      }

      const createBank = await Prisma.bankDetail.create({
        data: {
          ...rest,
          userId: targetUserId,
          bankProofFile: proofUrl,
          status,
        },
      });

      if (!createBank) {
        if (req) {
          await AuditLogService.createAuditLog({
            userId: payload.userId,
            action: "BANK_CREATION_FAILED",
            entityType: "BANK",
            entityId: null,
            ipAddress: Helper.getClientIP(req),
            metadata: {
              ...Helper.generateCommonMetadata(req, res),
              roleType: userExists.role.type,
              roleName: userExists.role.name,
              reason: "DATABASE_CREATION_FAILED",
              targetUserId: targetUserId,
            },
          });
        }
        throw ApiError.internal("Failed to create bank details");
      }

      // Audit log for successful bank creation
      if (req) {
        await AuditLogService.createAuditLog({
          userId: payload.userId,
          action: "BANK_CREATED",
          entityType: "BANK",
          entityId: createBank.id,
          ipAddress: Helper.getClientIP(req),
          metadata: {
            ...Helper.generateCommonMetadata(req, res),
            roleType: userExists.role.type,
            roleName: userExists.role.name,
            bankName: createBank.bankName,
            accountNumber: createBank.accountNumber?.substring(0, 3) + "***",
            status: createBank.status,
            isPrimary: createBank.isPrimary,
            proofUploaded: !!proofUrl,
            targetUserId: targetUserId,
            isEmployeeAction: userRoleType === "employee",
          },
        });
      }

      return createBank;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw ApiError.internal("Failed to Add bank account", error.message);
    } finally {
      if (bankProofFile?.path) {
        await Helper.deleteOldImage(bankProofFile.path);
      }
    }
  }

  static async update(id, userId, payload, req = null, res = null) {
    try {
      const userExists = await Prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: {
            select: {
              type: true,
              name: true,
            },
          },
        },
      });

      if (!userExists) {
        throw ApiError.notFound("User not found");
      }

      const userRoleType = userExists.role.type;
      let targetUserId = userId;

      if (userRoleType === "employee") {
        const adminUser = await Prisma.user.findFirst({
          where: {
            role: {
              name: "ADMIN",
            },
          },
        });

        if (!adminUser) {
          throw new Error("Admin user not found");
        }
        targetUserId = adminUser.id;
      }

      const record = await Prisma.bankDetail.findUnique({
        where: { id },
      });

      if (!record || record.userId !== targetUserId) {
        if (req) {
          await AuditLogService.createAuditLog({
            userId: userId,
            action: "BANK_UPDATE_FAILED",
            entityType: "BANK",
            entityId: id,
            ipAddress: Helper.getClientIP(req),
            metadata: {
              ...Helper.generateCommonMetadata(req, res),
              roleType: userExists.role.type,
              roleName: userExists.role.name,
              reason: "UNAUTHORIZED_ACCESS",
              actualOwnerId: record?.userId,
              targetUserId: targetUserId,
            },
          });
        }
        throw ApiError.forbidden("Unauthorized access");
      }

      let proofUrl;

      if (payload.bankProofFile) {
        if (record.bankProofFile) {
          await S3Service.delete({ fileUrl: record.bankProofFile });
        }

        proofUrl = await S3Service.upload(
          payload.bankProofFile.path,
          "bankdoc"
        );
      }

      if (payload.isPrimary) {
        await Prisma.bankDetail.updateMany({
          where: { userId: targetUserId },
          data: { isPrimary: false },
        });
      }

      let newStatus = record.status;
      let newRejectionReason = record.bankRejectionReason;

      if (record.status === "REJECT" || record.status === "VERIFIED") {
        newStatus = "PENDING";
      }

      if (record.status === "REJECT") {
        newRejectionReason = null;
      }

      if (
        userExists.role.name === "ADMIN" ||
        userExists.role.type === "employee"
      ) {
        newStatus = "VERIFIED";
      }

      const updateBank = await Prisma.bankDetail.update({
        where: { id },
        data: {
          ...payload,
          bankProofFile: proofUrl || record.bankProofFile,
          status: newStatus,
          bankRejectionReason: newRejectionReason,
        },
      });

      if (!updateBank) {
        if (req) {
          await AuditLogService.createAuditLog({
            userId: userId,
            action: "BANK_UPDATE_FAILED",
            entityType: "BANK",
            entityId: id,
            ipAddress: Helper.getClientIP(req),
            metadata: {
              ...Helper.generateCommonMetadata(req, res),
              roleType: userExists.role.type,
              roleName: userExists.role.name,
              reason: "DATABASE_UPDATE_FAILED",
              targetUserId: targetUserId,
            },
          });
        }
        throw ApiError.internal("Failed to update bank details");
      }

      if (req) {
        await AuditLogService.createAuditLog({
          userId: userId,
          action: "BANK_UPDATED",
          entityType: "BANK",
          entityId: id,
          ipAddress: Helper.getClientIP(req),
          metadata: {
            ...Helper.generateCommonMetadata(req, res),
            roleType: userExists.role.type,
            roleName: userExists.role.name,
            previousStatus: record.status,
            newStatus: updateBank.status,
            isPrimary: updateBank.isPrimary,
            proofUpdated: !!proofUrl,
            fieldsUpdated: Object.keys(payload).filter(
              (key) => key !== "bankProofFile"
            ),
            targetUserId: targetUserId,
            isEmployeeAction: userRoleType === "employee",
          },
        });
      }

      return updateBank;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw ApiError.internal("update bank failed:", error.message);
    } finally {
      const allFiles = [payload.bankProofFile?.path].filter(Boolean);
      for (const filePath of allFiles) {
        await Helper.deleteOldImage(filePath);
      }
    }
  }

  static async destroy(id, userId, req = null, res = null) {
    const userExists = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: {
            type: true,
            name: true,
          },
        },
      },
    });

    if (!userExists) {
      throw ApiError.notFound("User not found");
    }

    const userRoleType = userExists.role.type;
    let targetUserId = userId;

    if (userRoleType === "employee") {
      const adminUser = await Prisma.user.findFirst({
        where: {
          role: {
            name: "ADMIN",
          },
        },
      });

      if (!adminUser) {
        throw new Error("Admin user not found");
      }
      targetUserId = adminUser.id;
    }

    const record = await Prisma.bankDetail.findUnique({ where: { id } });

    if (!record || record.userId !== targetUserId) {
      if (req) {
        await AuditLogService.createAuditLog({
          userId: userId,
          action: "BANK_DELETION_FAILED",
          entityType: "BANK",
          entityId: id,
          ipAddress: Helper.getClientIP(req),
          metadata: {
            ...Helper.generateCommonMetadata(req, res),
            roleType: userExists.role.type,
            roleName: userExists.role.name,
            reason: "UNAUTHORIZED_ACCESS",
            actualOwnerId: record?.userId,
            targetUserId: targetUserId,
          },
        });
      }
      throw ApiError.forbidden("Unauthorized access");
    }

    const deleteBank = await Prisma.bankDetail.delete({ where: { id } });

    if (!deleteBank) {
      if (req) {
        await AuditLogService.createAuditLog({
          userId: userId,
          action: "BANK_DELETION_FAILED",
          entityType: "BANK",
          entityId: id,
          ipAddress: Helper.getClientIP(req),
          metadata: {
            ...Helper.generateCommonMetadata(req, res),
            roleType: userExists.role.type,
            roleName: userExists.role.name,
            reason: "DATABASE_DELETION_FAILED",
            targetUserId: targetUserId,
          },
        });
      }
      throw ApiError.internal("Failed to delete bank");
    }

    if (record.bankProofFile) {
      try {
        await S3Service.delete({ fileUrl: record.bankProofFile });
      } catch (s3Error) {
        console.error("Failed to delete bank proof from S3:", s3Error);
      }
    }

    if (req) {
      await AuditLogService.createAuditLog({
        userId: userId,
        action: "BANK_DELETED",
        entityType: "BANK",
        entityId: id,
        ipAddress: Helper.getClientIP(req),
        metadata: {
          ...Helper.generateCommonMetadata(req, res),
          roleType: userExists.role.type,
          roleName: userExists.role.name,
          bankName: record.bankName,
          accountNumber: record.accountNumber?.substring(0, 3) + "***",
          status: record.status,
          targetUserId: targetUserId,
          isEmployeeAction: userRoleType === "employee",
        },
      });
    }

    return deleteBank;
  }

  // ================= BANK Admin manage =================
  static async verification(id, userId, payload, req = null, res = null) {
    const userExists = await Prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!userExists) {
      // Audit log for user not found
      if (req) {
        await AuditLogService.createAuditLog({
          userId: userId,
          action: "BANK_CREATION_FAILED",
          entityType: "BANK",
          entityId: req.user.id,
          ipAddress: Helper.getClientIP(req),
          metadata: {
            ...Helper.generateCommonMetadata(req, res),
            roleType: userExists.role.type,
            roleName: userExists.role.name,
            reason: "USER_NOT_FOUND",
          },
        });
      }
      throw ApiError.notFound("User not found");
    }

    if (!id) throw ApiError.badRequest("Bank ID is required");

    const record = await Prisma.bankDetail.findUnique({ where: { id } });
    if (!record) {
      // Audit log for bank not found during verification
      if (req) {
        await AuditLogService.createAuditLog({
          userId: userId,
          action: "BANK_VERIFICATION_FAILED",
          entityType: "BANK",
          entityId: id,
          ipAddress: Helper.getClientIP(req),
          metadata: {
            ...Helper.generateCommonMetadata(req, res),
            roleType: userExists.role.type,
            roleName: userExists.role.name,
            reason: "BANK_NOT_FOUND",
          },
        });
      }
      throw ApiError.notFound("Bank record not found");
    }

    const user = await Prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const isAdmin =
      user?.role?.name === "ADMIN" || user?.role?.type === "employee";

    if (!isAdmin && record.userId !== userId) {
      // Audit log for unauthorized verification attempt
      if (req) {
        await AuditLogService.createAuditLog({
          userId: userId,
          action: "BANK_VERIFICATION_FAILED",
          entityType: "BANK",
          entityId: id,
          ipAddress: Helper.getClientIP(req),
          metadata: {
            ...Helper.generateCommonMetadata(req, res),
            roleType: userExists.role.type,
            roleName: userExists.role.name,
            reason: "UNAUTHORIZED_ACCESS",
            userRole: user?.role?.name,
            requiredRole: "ADMIN",
          },
        });
      }
      throw ApiError.forbidden("Unauthorized access");
    }

    const updatedBank = await Prisma.bankDetail.update({
      where: { id },
      data: {
        status: payload.status ?? record.status,
        bankRejectionReason:
          payload.bankRejectionReason ?? record.bankRejectionReason ?? "",
      },
    });

    // Audit log for bank verification
    if (req) {
      await AuditLogService.createAuditLog({
        userId: userId,
        action: `BANK_VERIFICATION_${updatedBank.status.toUpperCase()}`,
        entityType: "BANK",
        entityId: id,
        ipAddress: Helper.getClientIP(req),
        metadata: {
          ...Helper.generateCommonMetadata(req, res),
          roleType: userExists.role.type,
          roleName: userExists.role.name,
          previousStatus: record.status,
          newStatus: updatedBank.status,
          bankRejectionReason: updatedBank.bankRejectionReason,
          verifiedByAdmin: isAdmin,
          bankOwnerId: record.userId,
        },
      });
    }

    return updatedBank;
  }
}
