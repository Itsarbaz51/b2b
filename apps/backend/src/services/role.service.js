import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import AuditLogService from "./auditLog.service.js";
import Helper from "../utils/helper.js";

class RoleServices {
  static getAllRoles = async (options = {}) => {
    const { currentUserRoleLevel, excludeAdmin = false } = options;

    const where = {};

    if (excludeAdmin) {
      where.name = { not: "ADMIN" };
    }

    if (typeof currentUserRoleLevel === "number") {
      where.level = { gt: currentUserRoleLevel };
    }

    // Query using Prisma
    const roles = await Prisma.role.findMany({
      where,
      orderBy: { level: "asc" },
      select: {
        id: true,
        name: true,
        type: true,
        level: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return roles;
  };

  static async getAllRolesByType(options) {
    const { currentUserRoleLevel, type, currentUser } = options;

    if (!type) {
      throw new Error("Type parameter is required");
    }

    if (!["employee", "business"].includes(type)) {
      throw new Error(
        "Invalid type parameter. Must be 'employee' or 'business'"
      );
    }

    const where = {
      type: type,
    };

    where.NOT = {
      name: "ADMIN",
    };

    // Role level logic based on current user's role
    if (currentUser?.role?.name === "ADMIN") {
      delete where.level;
    } else if (currentUser?.role?.type === "employee") {
      delete where.level;
    } else if (typeof currentUserRoleLevel === "number") {
      where.level = { gt: currentUserRoleLevel };
    }

    try {
      const roles = await Prisma.role.findMany({
        where,
        orderBy: { level: "asc" },
        include: {
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              users: true,
              rolePermissions: true,
            },
          },
        },
      });

      const roleDTOs = roles.map((role) => ({
        id: role.id,
        name: role.name,
        type: role.type,
        level: role.level,
        description: role.description,
        createdBy: role.createdByUser
          ? `${role.createdByUser.firstName} ${role.createdByUser.lastName}`
          : "System",
        createdByUser: role.createdByUser
          ? {
              id: role.createdByUser.id,
              firstName: role.createdByUser.firstName,
              lastName: role.createdByUser.lastName,
              email: role.createdByUser.email,
            }
          : null,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        userCount: role._count.users,
        permissionCount: role._count.rolePermissions,
      }));

      return {
        roles: roleDTOs,
        meta: {
          total: roleDTOs.length,
          type: type,
          filteredByLevel:
            typeof currentUserRoleLevel === "number" &&
            currentUser?.role?.name !== "ADMIN" &&
            currentUser?.role?.type !== "employee",
          currentUserRoleName: currentUser?.role?.name,
          currentUserRoleType: currentUser?.role?.type,
          currentUserRoleLevel: currentUserRoleLevel,
          excludedAdminRole: true,
        },
      };
    } catch (error) {
      console.error("Error in getAllRolesByType:", error);
      throw ApiError.internal(
        `Failed to fetch ${type} roles: ${error.message}`
      );
    }
  }

  static async createRole(payload, req = null, res = null) {
    let { name, description, type = "employee", createdBy } = payload;

    // TYPE VALIDATION: Only allow creating 'employee' type roles
    if (type !== "employee") {
      await AuditLogService.createAuditLog({
        userId: createdBy,
        action: "ROLE_CREATION_FAILED",
        entityType: "ROLE",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "INVALID_ROLE_TYPE",
          roleName: req.user.role,
          providedType: type,
          roleName: name,
          createdBy: createdBy,
        },
      });
      throw ApiError.badRequest("Only 'employee' type roles can be created");
    }

    const existingByName = await Prisma.role.findUnique({
      where: { name },
    });
    if (existingByName) {
      await AuditLogService.createAuditLog({
        userId: createdBy,
        action: "ROLE_CREATION_FAILED",
        entityType: "ROLE",
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "ROLE_NAME_EXISTS",
          roleName: req.user.role,
          createdBy: createdBy,
        },
      });
      throw ApiError.conflict("Role with this name already exists");
    }

    // Auto-determine level for employee roles - start from level 5 since 0-4 are taken by business roles
    const maxLevelRole = await Prisma.role.findFirst({
      orderBy: { level: "desc" },
    });
    const level = maxLevelRole ? maxLevelRole.level + 1 : 5;

    const role = await Prisma.role.create({
      data: {
        name,
        type: "employee", // Force type to be 'employee'
        level,
        description: description ?? null,
        createdBy,
      },
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Assign default permissions to all active services
    const services = await Prisma.serviceProvider.findMany({
      where: { isActive: true },
    });

    if (services.length > 0) {
      const rolePermissionData = services.map((service) => ({
        roleId: role.id,
        serviceId: service.id,
        canView: true,
        canEdit: false,
        canSetCommission: false,
        canProcess: false,
      }));

      await Prisma.rolePermission.createMany({
        data: rolePermissionData,
        skipDuplicates: true,
      });
    }

    // Return DTO
    const dto = {
      id: role.id,
      name: role.name,
      type: role.type,
      level: role.level,
      description: role.description,
      createdBy,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };

    // Audit log for successful role creation
    await AuditLogService.createAuditLog({
      userId: createdBy,
      action: "ROLE_CREATED",
      entityType: "ROLE",
      entityId: role.id,
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
        createRoleName: role.name,
        roleName: req.user.role,
        roleLevel: role.level,
        roleType: role.type,
        servicesWithPermissions: services.length,
        createdBy: createdBy,
      },
    });

    return dto;
  }

  static async updateRole(id, payload, req = null, res = null) {
    let currentUserId = req.user.id;

    const { name, description, level, type } = payload;

    // Check if role exists
    const existingRole = await Prisma.role.findUnique({
      where: { id },
    });
    if (!existingRole) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "ROLE_UPDATE_FAILED",
        entityType: "ROLE",
        entityId: id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "ROLE_NOT_FOUND",
          roleName: req.user.role,
          updatedBy: currentUserId,
        },
      });
      return null;
    }

    // TYPE CHECK: Only allow updating 'employee' type roles
    if (existingRole.type !== "employee") {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "ROLE_UPDATE_FAILED",
        entityType: "ROLE",
        entityId: id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "NON_EMPLOYEE_ROLE_UPDATE",
          existingRoleName: existingRole.name,
          roleName: req.user.role,
          roleType: existingRole.type,
          updatedBy: currentUserId,
        },
      });
      throw ApiError.forbidden("Cannot update non-employee type roles");
    }

    // Check for name conflict with other roles
    if (name && name !== existingRole.name) {
      const existingByName = await Prisma.role.findUnique({
        where: { name },
      });
      if (existingByName && existingByName.id !== id) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "ROLE_UPDATE_FAILED",
          entityType: "ROLE",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "ROLE_NAME_EXISTS",
            roleName: req.user.role,
            newRoleName: name,
            updatedBy: currentUserId,
          },
        });
        throw ApiError.conflict("Role with this name already exists");
      }
    }

    // Check for level conflict with other roles
    if (level !== undefined && level !== existingRole.level) {
      const existingByLevel = await Prisma.role.findUnique({
        where: { level },
      });
      if (existingByLevel && existingByLevel.id !== id) {
        await AuditLogService.createAuditLog({
          userId: currentUserId,
          action: "ROLE_UPDATE_FAILED",
          entityType: "ROLE",
          entityId: id,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "ROLE_LEVEL_EXISTS",
            roleName: req.user.role,
            newRoleLevel: level,
            updatedBy: currentUserId,
          },
        });
        throw ApiError.conflict("Role with this level already exists");
      }
    }

    // Prevent changing type to 'business'
    if (type && type !== "employee") {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "ROLE_UPDATE_FAILED",
        entityType: "ROLE",
        entityId: id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "INVALID_ROLE_TYPE_CHANGE",
          roleName: req.user.role,
          newType: type,
          updatedBy: currentUserId,
        },
      });
      throw ApiError.badRequest("Cannot change role type to non-employee");
    }

    const updateData = {};
    const updatedFields = [];

    if (name) {
      updateData.name = name;
      updatedFields.push("name");
    }
    if (description !== undefined) {
      updateData.description = description;
      updatedFields.push("description");
    }
    if (level !== undefined) {
      updateData.level = level;
      updatedFields.push("level");
    }
    updateData.type = "employee"; // Force type to remain 'employee'

    const role = await Prisma.role.update({
      where: { id },
      data: updateData,
      include: {
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const dto = {
      id: role.id,
      name: role.name,
      type: role.type,
      level: role.level,
      description: role.description,
      createdBy: role.createdBy || "",
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };

    // Audit log for successful role update
    await AuditLogService.createAuditLog({
      userId: currentUserId,
      action: "ROLE_UPDATED",
      entityType: "ROLE",
      entityId: id,
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
        createdRoleName: role.name,
        roleName: req.user.role,
        updatedFields: updatedFields,
        previousName: existingRole.name,
        previousLevel: existingRole.level,
        previousDescription: existingRole.description,
        updatedBy: currentUserId,
      },
    });

    return dto;
  }

  static async deleteRole(id, req = null, res = null) {
    console.log(id);
    console.log(req.user);

    let currentUserId = req.user.id;
    // Check if role exists
    const existingRole = await Prisma.role.findUnique({
      where: { id },
      include: {
        users: {
          take: 1,
        },
      },
    });

    if (!existingRole) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "ROLE_DELETION_FAILED",
        entityType: "ROLE",
        entityId: id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "ROLE_NOT_FOUND",
          deletedBy: currentUserId,
        },
      });
      return false;
    }

    // TYPE CHECK: Only allow deleting 'employee' type roles
    if (existingRole.type !== "employee") {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "ROLE_DELETION_FAILED",
        entityType: "ROLE",
        entityId: id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "NON_EMPLOYEE_ROLE_DELETION",
          roleName: existingRole.name,
          roleType: existingRole.type,
          deletedBy: currentUserId,
        },
      });
      throw ApiError.forbidden("Cannot delete non-employee type roles");
    }

    // Check if role is assigned to any users
    if (existingRole.users.length > 0) {
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "ROLE_DELETION_FAILED",
        entityType: "ROLE",
        entityId: id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "ROLE_ASSIGNED_TO_USERS",
          roleName: existingRole.name,
          userCount: existingRole.users.length,
          deletedBy: currentUserId,
        },
      });
      throw ApiError.conflict("Cannot delete role assigned to users");
    }

    // Use transaction to delete role and its related data
    await Prisma.$transaction(async (tx) => {
      // Delete role permissions
      await tx.rolePermission.deleteMany({
        where: { roleId: id },
      });

      // Delete commission settings
      await tx.commissionSetting.deleteMany({
        where: { roleId: id },
      });

      // Delete the role
      await tx.role.delete({
        where: { id },
      });
    });

    // Audit log for successful role deletion
    await AuditLogService.createAuditLog({
      userId: currentUserId,
      action: "ROLE_DELETED",
      entityType: "ROLE",
      entityId: id,
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
        roleName: existingRole.name,
        roleLevel: existingRole.level,
        deletedBy: currentUserId,
      },
    });

    return true;
  }
}

export default RoleServices;
