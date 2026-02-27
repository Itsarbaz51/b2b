import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import AuditLogService from "./auditLog.service.js";
import Helper from "../utils/helper.js";

export class RolePermissionService {
  static async createOrUpdateRolePermission(data, req = null, res = null) {
    let currentUserId = req.user.id;

    const { roleId, serviceIds, ...permissions } = data;

    if (!roleId) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "ROLE_PERMISSION_CREATE_UPDATE_FAILED",
        entityType: "ROLE_PERMISSION",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "MISSING_ROLE_ID",
          roleName: req.user.role,
          attemptedBy: currentUserId,
        },
      });
      throw ApiError.badRequest("Role ID is required");
    }

    const role = await Prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "ROLE_PERMISSION_CREATE_UPDATE_FAILED",
        entityType: "ROLE_PERMISSION",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "ROLE_NOT_FOUND",
          roleName: req.user.role,
          roleId: roleId,
          attemptedBy: currentUserId,
        },
      });
      throw ApiError.notFound("Role not found");
    }

    // Process each service individually
    const results = [];
    const createdPermissions = [];
    const updatedPermissions = [];

    for (const serviceId of serviceIds) {
      const service = await Prisma.serviceProvider.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "ROLE_PERMISSION_CREATE_UPDATE_FAILED",
          entityType: "ROLE_PERMISSION",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "SERVICE_NOT_FOUND",
            roleId: roleId,
            roleName: req.user.role,
            serviceId: serviceId,
            attemptedBy: currentUserId,
          },
        });
        throw ApiError.notFound(`Service not found: ${serviceId}`);
      }

      // Check if permission already exists
      const existing = await Prisma.rolePermission.findUnique({
        where: {
          roleId_serviceId: {
            roleId,
            serviceId,
          },
        },
      });

      let result;

      if (existing) {
        result = await Prisma.rolePermission.update({
          where: {
            roleId_serviceId: {
              roleId,
              serviceId,
            },
          },
          data: {
            ...permissions,
          },
        });
        updatedPermissions.push({
          serviceId,
          serviceName: service.name,
          permissions: permissions,
        });
      } else {
        result = await Prisma.rolePermission.create({
          data: {
            roleId,
            serviceId,
            ...permissions,
          },
        });
        createdPermissions.push({
          serviceId,
          serviceName: service.name,
          permissions: permissions,
        });
      }

      results.push(result);
    }

    // Audit log for successful operation
    await AuditLogService.createAuditLog({
      userId: currentUserId,
      action: "ROLE_PERMISSIONS_UPDATED",
      entityType: "ROLE",
      entityId: roleId,
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
        exsitsRoleName: role.name,
        roleName: req.user.role,
        totalServices: serviceIds.length,
        createdPermissions: createdPermissions,
        updatedPermissions: updatedPermissions,
        permissionDetails: permissions,
        updatedBy: currentUserId,
      },
    });

    return results;
  }

  static async getRolePermissions(roleId) {
    if (!roleId) throw ApiError.badRequest("Role ID is required");

    const permissions = await Prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        service: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    if (!permissions.length) {
      throw ApiError.notFound("No permissions found for this role");
    }
    return permissions;
  }

  static async deleteRolePermission(roleId, serviceId, req = null, res = null) {
    let currentUserId = req.user.id;
    if (!roleId) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "ROLE_PERMISSION_DELETION_FAILED",
        entityType: "ROLE_PERMISSION",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "MISSING_ROLE_ID",
          roleName: req.user.role,
          deletedBy: currentUserId,
        },
      });
      throw ApiError.badRequest("Role ID is required");
    }

    if (!serviceId) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "ROLE_PERMISSION_DELETION_FAILED",
        entityType: "ROLE_PERMISSION",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "MISSING_SERVICE_ID",
          roleId: roleId,
          roleName: req.user.role,
          deletedBy: currentUserId,
        },
      });
      throw ApiError.badRequest("Service ID is required");
    }

    const existing = await Prisma.rolePermission.findUnique({
      where: { roleId_serviceId: { roleId, serviceId } },
      include: {
        role: { select: { name: true } },
        service: { select: { name: true } },
      },
    });

    if (!existing) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "ROLE_PERMISSION_DELETION_FAILED",
        entityType: "ROLE_PERMISSION",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "PERMISSION_NOT_FOUND",
          roleId: roleId,
          roleName: req.user.role,
          serviceId: serviceId,
          deletedBy: currentUserId,
        },
      });
      throw ApiError.notFound("RolePermission not found");
    }

    const deleted = await Prisma.rolePermission.delete({
      where: { roleId_serviceId: { roleId, serviceId } },
    });

    // Audit log for successful deletion
    await AuditLogService.createAuditLog({
      userId: currentUserId,
      action: "ROLE_PERMISSION_DELETED",
      entityType: "ROLE",
      entityId: roleId,
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
        existingRoleName: existing.role.name,
        roleName: req.user.role,
        serviceName: existing.service.name,
        deletedBy: currentUserId,
      },
    });

    return deleted;
  }
}

export class UserPermissionService {
  static async createOrUpdateUserPermission(data, req = null, res = null) {
    const { userId, serviceIds, ...permissions } = data;
    let currentUserId = req.user.id;

    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: { role: { select: { name: true } } },
    });

    if (!user) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "USER_PERMISSION_CREATE_UPDATE_FAILED",
        entityType: "USER_PERMISSION",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "USER_NOT_FOUND",
          roleName: req.user.role,
          targetUserId: userId,
          attemptedBy: currentUserId,
        },
      });
      throw ApiError.notFound("User not found");
    }

    // Agar serviceIds empty hai to user ke saare existing permissions delete karo
    if (!serviceIds || serviceIds.length === 0) {
      const deletedCount = await Prisma.userPermission.count({
        where: { userId },
      });

      await Prisma.userPermission.deleteMany({
        where: { userId },
      });

      // Audit log for clearing all permissions
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "USER_PERMISSIONS_CLEARED",
        entityType: "USER",
        entityId: userId,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          userName: `${user.firstName} ${user.lastName}`,
          userRole: user.role.name,
          roleName: req.user.role,
          deletedPermissionsCount: deletedCount,
          clearedBy: currentUserId,
        },
      });

      return [];
    }

    // Process each service individually
    const results = [];
    const createdPermissions = [];
    const updatedPermissions = [];
    const removedPermissions = [];

    // Pehle existing permissions mein se jo services nahi hain serviceIds mein, unko delete karo
    const existingPermissions = await Prisma.userPermission.findMany({
      where: { userId },
      include: { service: { select: { name: true } } },
    });

    const existingServiceIds = existingPermissions.map(
      (perm) => perm.serviceId
    );
    const servicesToRemove = existingServiceIds.filter(
      (serviceId) => !serviceIds.includes(serviceId)
    );

    // Remove permissions for services that are not in the new serviceIds
    if (servicesToRemove.length > 0) {
      const removedPerms = await Prisma.userPermission.findMany({
        where: {
          userId,
          serviceId: { in: servicesToRemove },
        },
        include: { service: { select: { name: true } } },
      });

      await Prisma.userPermission.deleteMany({
        where: {
          userId,
          serviceId: { in: servicesToRemove },
        },
      });

      removedPermissions.push(
        ...removedPerms.map((p) => ({
          serviceId: p.serviceId,
          serviceName: p.service.name,
        }))
      );
    }

    // Ab create/update karo remaining services ke liye
    for (const serviceId of serviceIds) {
      const service = await Prisma.serviceProvider.findUnique({
        where: { id: serviceId },
      });

      if (!service) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "USER_PERMISSION_CREATE_UPDATE_FAILED",
          entityType: "USER_PERMISSION",
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "SERVICE_NOT_FOUND",
            targetUserId: userId,
            roleName: req.user.role,
            serviceId: serviceId,
            attemptedBy: currentUserId,
          },
        });
        throw ApiError.notFound(`Service not found: ${serviceId}`);
      }

      // Check if permission already exists
      const existing = await Prisma.userPermission.findUnique({
        where: {
          userId_serviceId: {
            userId,
            serviceId,
          },
        },
      });

      let result;

      if (existing) {
        result = await Prisma.userPermission.update({
          where: {
            userId_serviceId: {
              userId,
              serviceId,
            },
          },
          data: {
            ...permissions,
          },
        });
        updatedPermissions.push({
          serviceId,
          serviceName: service.name,
          permissions: permissions,
        });
      } else {
        result = await Prisma.userPermission.create({
          data: {
            userId,
            serviceId,
            ...permissions,
          },
        });
        createdPermissions.push({
          serviceId,
          serviceName: service.name,
          permissions: permissions,
        });
      }

      results.push(result);
    }

    // Audit log for successful operation
    await AuditLogService.createAuditLog({
      userId: currentUserId,
      action: "USER_PERMISSIONS_UPDATED",
      entityType: "USER",
      entityId: userId,
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
        userName: `${user.firstName} ${user.lastName}`,
        userRole: user.role.name,
        totalServices: serviceIds.length,
        createdPermissions: createdPermissions,
        roleName: req.user.role,
        updatedPermissions: updatedPermissions,
        removedPermissions: removedPermissions,
        permissionDetails: permissions,
        updatedBy: currentUserId,
      },
    });

    return results;
  }

  static async getUserPermissions(userId) {
    if (!userId) {
      throw ApiError.badRequest("User ID is required");
    }

    const permissions = await Prisma.userPermission.findMany({
      where: {
        userId,
      },
      select: {
        id: true,
        canView: true,
        service: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!permissions.length) {
      return;
    }

    return permissions;
  }

  static async deleteUserPermission(userId, serviceId, req = null, res = null) {
    let currentUserId = req.user.id;
    if (!userId) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "USER_PERMISSION_DELETION_FAILED",
        entityType: "USER_PERMISSION",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "MISSING_USER_ID",
          roleName: req.user.role,
          deletedBy: currentUserId,
        },
      });
      throw ApiError.badRequest("User ID is required");
    }

    if (!serviceId) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "USER_PERMISSION_DELETION_FAILED",
        entityType: "USER_PERMISSION",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "MISSING_SERVICE_ID",
          userId: userId,
          roleName: req.user.role,
          deletedBy: currentUserId,
        },
      });
      throw ApiError.badRequest("Service ID is required");
    }

    const existing = await Prisma.userPermission.findUnique({
      where: { userId_serviceId: { userId, serviceId } },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            role: { select: { name: true } },
          },
        },
        service: { select: { name: true } },
      },
    });

    if (!existing) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "USER_PERMISSION_DELETION_FAILED",
        entityType: "USER_PERMISSION",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "PERMISSION_NOT_FOUND",
          userId: userId,
          roleName: req.user.role,
          serviceId: serviceId,
          deletedBy: currentUserId,
        },
      });
      throw ApiError.notFound("UserPermission not found");
    }

    const deleted = await Prisma.userPermission.delete({
      where: { userId_serviceId: { userId, serviceId } },
    });

    // Audit log for successful deletion
    await AuditLogService.createAuditLog({
      userId: currentUserId,
      action: "USER_PERMISSION_DELETED",
      entityType: "USER",
      entityId: userId,
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
        userName: `${existing.user.firstName} ${existing.user.lastName}`,
        userRole: existing.user.role.name,
        roleName: req.user.role,
        serviceName: existing.service.name,
        deletedBy: currentUserId,
      },
    });

    return deleted;
  }
}
