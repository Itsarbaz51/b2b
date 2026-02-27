import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import { CryptoService } from "../utils/cryptoService.js";
import Helper from "../utils/helper.js";
import S3Service from "../utils/S3Service.js";
import { sendCredentialsEmail } from "../utils/sendCredentialsEmail.js";
import AuditLogService from "./auditLog.service.js";

class EmployeeServices {
  // COMMON USER SELECT FIELDS (DRY Principle)
  static roleSelectFields = {
    id: true,
    name: true,
    level: true,
    description: true,
    type: true,
  };

  static userSelectFields = {
    id: true,
    username: true,
    firstName: true,
    lastName: true,
    email: true,
    phoneNumber: true,
    profileImage: true,
    status: true,
    hierarchyLevel: true,
    hierarchyPath: true,
    createdAt: true,
    updatedAt: true,
  };

  // EMPLOYEE REGISTRATION
  static async register(payload, req = null, res = null) {
    const {
      username,
      firstName,
      lastName,
      profileImage,
      email,
      phoneNumber,
      roleId,
      parentId,
      permissions = [],
    } = payload;

    try {
      // Validate role
      const role = await this.validateEmployeeRole(roleId);

      // Check existing user
      await this.checkExistingUser({ email, phoneNumber, username });

      const generatedPassword = Helper.generatePassword();
      const hashedPassword = CryptoService.encrypt(generatedPassword);

      // Setup hierarchy
      const { hierarchyLevel, hierarchyPath } =
        await this.setupHierarchy(parentId);

      // Upload profile image
      const profileImageUrl = await this.handleProfileImageUpload(profileImage);

      const formattedFirstName = this.formatName(firstName);
      const formattedLastName = this.formatName(lastName);

      // Create user
      const user = await Prisma.user.create({
        data: {
          username,
          firstName: formattedFirstName,
          lastName: formattedLastName,
          profileImage: profileImageUrl,
          email: email.toLowerCase(),
          phoneNumber,
          password: hashedPassword,
          roleId,
          parentId,
          hierarchyLevel,
          hierarchyPath,
          status: "ACTIVE",
          deactivationReason: null,
          isKycVerified: true,
          emailVerifiedAt: new Date(),
        },
        include: {
          role: { select: this.roleSelectFields },
          parent: { select: this.userSelectFields },
        },
      });

      // Assign permissions
      if (permissions.length > 0) {
        await this.updateEmployeePermissions(
          user.id,
          permissions,
          parentId,
          "EMPLOYEE_PERMISSIONS_ASSIGNED"
        );
      }

      // Send credentials
      await this.sendEmployeeCredentials(user, generatedPassword, permissions);

      // Generate access token
      const accessToken = Helper.generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role.name,
        roleLevel: user.role.level,
        permissions: permissions,
      });

      // Get current user role for audit log
      const currentUser = await Prisma.user.findUnique({
        where: { id: parentId },
        include: { role: true },
      });

      // Audit log
      await AuditLogService.createAuditLog({
        userId: parentId,
        action: "EMPLOYEE_CREATED",
        entityType: "EMPLOYEE",
        entityId: user.id,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          employeeEmail: user.email,
          employeeRole: user.role.name,
          permissionsCount: permissions.length,
          roleName: currentUser?.role?.name, // Use currentUser instead of req.user
          roleType: currentUser?.role?.type,
          createdBy: parentId,
        },
      });

      return { user, accessToken };
    } catch (error) {
      console.error("Employee registration error:", error);
      if (error instanceof ApiError) throw error;
      throw ApiError.internal("Failed to create employee");
    } finally {
      if (profileImage) Helper.deleteOldImage(profileImage);
    }
  }

  // UNIFIED EMPLOYEE PERMISSIONS MANAGEMENT
  static async updateEmployeePermissions(
    employeeId,
    permissions,
    adminId,
    req,
    res
  ) {
    // Validate employee exists
    const employee = await Prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, email: true },
    });

    if (!employee) {
      await AuditLogService.createAuditLog({
        userId: adminId,
        action: "EMPLOYEE_PERMISSIONS_UPDATE_FAILED",
        entityType: "EMPLOYEE",
        entityId: employeeId,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "EMPLOYEE_NOT_FOUND",
          roleName: req?.user?.roleres,
          updatedBy: adminId,
        },
      });
      throw ApiError.notFound("Employee not found");
    }

    if (!Array.isArray(permissions)) {
      await AuditLogService.createAuditLog({
        userId: adminId,
        action: "EMPLOYEE_PERMISSIONS_UPDATE_FAILED",
        entityType: "EMPLOYEE",
        entityId: employeeId,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "INVALID_PERMISSIONS_FORMAT",
          roleName: req?.user?.roleres,
          updatedBy: adminId,
        },
      });
      throw ApiError.badRequest("Permissions must be an array");
    }

    // Trim and normalize permissions
    const normalizedPermissions = permissions.map((p) => p.trim());
    const newPermissionSet = new Set(normalizedPermissions);

    // Get ALL permissions (both active and inactive) for this employee
    const allPermissions = await Prisma.employeePermission.findMany({
      where: { userId: employeeId },
    });

    const currentActivePermissions = allPermissions.filter((p) => p.isActive);
    const currentInactivePermissions = allPermissions.filter(
      (p) => !p.isActive
    );

    // Identify permissions to ACTIVATE (previously inactive, now in new set)
    const permissionsToActivate = currentInactivePermissions
      .filter((p) => newPermissionSet.has(p.permission))
      .map((p) => p.permission);

    // Identify permissions to DEACTIVATE (currently active, not in new set)
    const permissionsToDeactivate = currentActivePermissions
      .filter((p) => !newPermissionSet.has(p.permission))
      .map((p) => p.permission);

    // Identify permissions to CREATE (completely new permissions)
    const existingPermissionSet = new Set(
      allPermissions.map((p) => p.permission)
    );
    const permissionsToCreate = normalizedPermissions.filter(
      (permission) => !existingPermissionSet.has(permission)
    );

    // Use transaction for atomic operations
    await Prisma.$transaction(async (tx) => {
      // Activate previously inactive permissions
      if (permissionsToActivate.length > 0) {
        await tx.employeePermission.updateMany({
          where: {
            userId: employeeId,
            permission: { in: permissionsToActivate },
          },
          data: {
            isActive: true,
            assignedBy: adminId,
            assignedAt: new Date(),
            revokedAt: null,
          },
        });
      }

      // Deactivate permissions that are no longer in the set
      if (permissionsToDeactivate.length > 0) {
        await tx.employeePermission.updateMany({
          where: {
            userId: employeeId,
            permission: { in: permissionsToDeactivate },
          },
          data: {
            isActive: false,
            revokedAt: new Date(),
          },
        });
      }

      // Create completely new permissions
      if (permissionsToCreate.length > 0) {
        await tx.employeePermission.createMany({
          data: permissionsToCreate.map((permission) => ({
            userId: employeeId,
            permission: permission,
            assignedBy: adminId,
            assignedAt: new Date(),
            isActive: true,
          })),
          skipDuplicates: true,
        });
      }
    });

    // Create audit log
    await AuditLogService.createAuditLog({
      userId: adminId,
      action: "EMPLOYEE_PERMISSIONS_UPDATED",
      entityType: "EMPLOYEE",
      entityId: employeeId,
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
        employeeEmail: employee.email,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        activated: permissionsToActivate,
        deactivated: permissionsToDeactivate,
        created: permissionsToCreate,
        finalPermissions: normalizedPermissions,
        totalPermissions: normalizedPermissions.length,
        roleName: req?.user?.role,
        updatedBy: adminId,
      },
    });

    // Get updated permissions for response
    const updatedPermissions = await this.getEmployeePermissions(employeeId);

    return {
      success: true,
      employeeId,
      employeeEmail: employee.email,
      activated: permissionsToActivate,
      deactivated: permissionsToDeactivate,
      created: permissionsToCreate,
      permissions: updatedPermissions,
      totalPermissions: updatedPermissions.length,
      message: `Permissions updated successfully. Activated: ${permissionsToActivate.length}, Deactivated: ${permissionsToDeactivate.length}, Created: ${permissionsToCreate.length}`,
    };
  }

  // GET EMPLOYEE PERMISSIONS
  static async getEmployeePermissions(employeeId) {
    try {
      const permissions = await Prisma.employeePermission.findMany({
        where: {
          userId: employeeId,
          isActive: true,
        },
        select: {
          permission: true,
          assignedAt: true,
          assigner: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { assignedAt: "desc" },
      });

      return permissions.map((p) => p.permission);
    } catch (error) {
      console.error("Error fetching employee permissions:", error);
      return [];
    }
  }

  // EMPLOYEE PROFILE UPDATE
  static async updateProfile(userId, updateData, currentUserId) {
    // Remove req, res parameters
    const { username, phoneNumber, firstName, lastName, email, roleId } =
      updateData;

    const [currentUser, userToUpdate] = await Promise.all([
      Prisma.user.findUnique({
        where: { id: currentUserId },
        include: { role: { select: this.roleSelectFields } },
      }),
      Prisma.user.findUnique({
        where: { id: userId },
        include: { role: { select: this.roleSelectFields } },
      }),
    ]);

    if (!currentUser) {
      throw ApiError.unauthorized("Current user not found");
    }

    if (!userToUpdate) {
      throw ApiError.notFound("Employee not found");
    }

    if (userToUpdate.role.type !== "employee") {
      throw ApiError.badRequest("Can only update employees");
    }

    // Authorization check - ADMIN aur employee dono update kar sakte hain
    const isAdmin = currentUser.role.name === "ADMIN";
    const isEmployee = currentUser.role.type === "employee";

    // ADMIN aur employee dono ko full access hai kisi bhi employee ka profile update karne ka
    if (!isAdmin && !isEmployee) {
      const canUpdate = await this.checkPermission(
        currentUserId,
        "UPDATE_EMPLOYEE"
      );
      if (!canUpdate) {
        throw ApiError.forbidden(
          "You don't have permission to update employee profiles"
        );
      }
    }

    // Check unique constraints
    await this.checkUniqueConstraints(userId, { username, phoneNumber, email });

    const updatePayload = this.buildUpdatePayload(
      {
        username,
        firstName,
        lastName,
        phoneNumber,
        email,
        roleId,
      },
      isAdmin // Only admin can change role
    );

    const updatedUser = await Prisma.user.update({
      where: { id: userId },
      data: updatePayload,
      include: {
        role: { select: this.roleSelectFields },
        parent: { select: this.userSelectFields },
      },
    });

    // Handle email change
    if (email && email !== userToUpdate.email) {
      await this.regenerateCredentialsAndNotify(userId, email);
    }

    // Simple audit log without req, res
    await AuditLogService.createAuditLog({
      userId: currentUserId,
      action: "EMPLOYEE_PROFILE_UPDATED",
      entityType: "EMPLOYEE",
      entityId: userId,
      metadata: {
        updatedFields: Object.keys(updateData),
        emailChanged: !!email,
        roleChanged: !!roleId,
        roleName: currentUser.role.name,
        roleType: currentUser.role.type,
        isAdminAction: isAdmin,
        isEmployeeAction: isEmployee,
      },
    });

    return updatedUser;
  }

  static async updateProfileImage(
    employeeId,
    profileImagePath,
    req = null,
    res = null
  ) {
    try {
      // Find employee with role information
      const employee = await Prisma.user.findUnique({
        where: { id: employeeId },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              level: true,
              description: true,
              type: true,
            },
          },
        },
      });

      if (!employee) {
        await AuditLogService.createAuditLog({
          userId: req?.user?.id,
          action: "EMPLOYEE_PROFILE_IMAGE_UPDATE_FAILED",
          entityType: "EMPLOYEE",
          entityId: employeeId,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "EMPLOYEE_NOT_FOUND",
            roleName: req?.user?.role,
            updatedBy: req?.user?.id,
          },
        });
        throw ApiError.notFound("Employee not found");
      }

      // Ensure it's an employee user
      if (employee.role.type !== "employee") {
        await AuditLogService.createAuditLog({
          userId: req?.user?.id,
          action: "EMPLOYEE_PROFILE_IMAGE_UPDATE_FAILED",
          entityType: "EMPLOYEE",
          entityId: employeeId,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "NON_EMPLOYEE_USER",
            roleName: req?.user?.role,
            updatedBy: req?.user?.id,
          },
        });
        throw ApiError.badRequest("Can only update employee profile images");
      }

      // Get current user with role information
      const currentUserId = req?.user?.id;
      let currentUserRoleType = req?.user?.role?.type;
      let currentUserRoleName = req?.user?.role?.name;

      // If role info not in request, fetch from database
      if (!currentUserRoleType || !currentUserRoleName) {
        const currentUser = await Prisma.user.findUnique({
          where: { id: currentUserId },
          include: {
            role: {
              select: {
                type: true,
                name: true,
              },
            },
          },
        });
        currentUserRoleType = currentUser?.role?.type;
        currentUserRoleName = currentUser?.role?.name;
      }

      // Authorization check - ADMIN aur employee dono kisi bhi employee ka profile update kar sakte hain
      const isAdmin = currentUserRoleName === "ADMIN";
      const isEmployee = currentUserRoleType === "employee";
      const isUpdatingOwnProfile = employeeId === currentUserId;

      // ADMIN aur employee dono ko full access hai kisi bhi employee ka profile update karne ka
      if (!isAdmin && !isEmployee) {
        // Agar user na admin hai na employee, to check karo UPDATE_EMPLOYEE permission
        const canUpdate = await this.checkPermission(
          currentUserId,
          "UPDATE_EMPLOYEE"
        );
        if (!canUpdate) {
          await AuditLogService.createAuditLog({
            userId: currentUserId,
            action: "EMPLOYEE_PROFILE_IMAGE_UPDATE_FAILED",
            entityType: "EMPLOYEE",
            entityId: employeeId,
            ipAddress: req ? Helper.getClientIP(req) : null,
            metadata: {
              ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
              reason: "INSUFFICIENT_PERMISSIONS",
              roleName: currentUserRoleName,
              roleType: currentUserRoleType,
              updatedBy: currentUserId,
            },
          });
          throw ApiError.forbidden(
            "You don't have permission to update employee profile images"
          );
        }
      }

      let oldImageDeleted = false;
      // Delete old profile image if exists
      if (employee.profileImage) {
        try {
          await S3Service.delete({ fileUrl: employee.profileImage });
          oldImageDeleted = true;
        } catch (error) {
          console.error("Failed to delete old profile image", {
            employeeId,
            profileImage: employee.profileImage,
            error,
          });
          // Continue with update even if old image deletion fails
        }
      }

      // Upload new profile image
      const profileImageUrl =
        (await S3Service.upload(profileImagePath, "profile")) ?? "";

      // Update employee profile image
      const updatedEmployee = await Prisma.user.update({
        where: { id: employeeId },
        data: { profileImage: profileImageUrl },
        include: {
          role: {
            select: { id: true, name: true, level: true, description: true },
          },
          parent: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              email: true,
              phoneNumber: true,
              profileImage: true,
            },
          },
          EmployeePermissionsOwned: {
            where: { isActive: true },
            select: { permission: true, assignedAt: true },
          },
        },
      });

      // Audit log for successful profile image update
      await AuditLogService.createAuditLog({
        userId: currentUserId,
        action: "EMPLOYEE_PROFILE_IMAGE_UPDATED",
        entityType: "EMPLOYEE",
        entityId: employeeId,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          oldImageDeleted: oldImageDeleted,
          isOwnProfile: isUpdatingOwnProfile,
          roleName: currentUserRoleName,
          roleType: currentUserRoleType,
          updatedBy: currentUserId,
          isAdminAction: isAdmin,
          isEmployeeAction: isEmployee,
        },
      });

      return updatedEmployee;
    } catch (error) {
      await AuditLogService.createAuditLog({
        userId: req?.user?.id,
        action: "EMPLOYEE_PROFILE_IMAGE_UPDATE_FAILED",
        entityType: "EMPLOYEE",
        entityId: employeeId,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: error.message,
          roleName: req?.user?.role,
          updatedBy: req?.user?.id,
        },
      });
      console.error("Employee profile image update error:", error);
      throw error;
    } finally {
      // Clean up temporary file
      if (profileImagePath) {
        Helper.deleteOldImage(profileImagePath);
      }
    }
  }

  // PERMANENTLY DELETE EMPLOYEE
  static async deleteEmployee(
    employeeId,
    deletedBy,
    reason = "No reason provided",
    req = null,
    res = null
  ) {
    try {
      // Validate inputs
      if (!employeeId) {
        throw ApiError.badRequest("Employee ID is required");
      }

      if (!deletedBy) {
        throw ApiError.unauthorized("Authentication required");
      }

      // Get employee and current user details
      const [employee, currentUser] = await Promise.all([
        Prisma.user.findUnique({
          where: { id: employeeId },
          include: {
            role: true,
            EmployeePermissionsOwned: true,
          },
        }),
        Prisma.user.findUnique({
          where: { id: deletedBy },
          include: { role: true },
        }),
      ]);

      // Validate employee exists
      if (!employee) {
        await AuditLogService.createAuditLog({
          userId: deletedBy,
          action: "EMPLOYEE_DELETION_FAILED",
          entityType: "EMPLOYEE",
          entityId: employeeId,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "EMPLOYEE_NOT_FOUND",
            roleName: currentUser?.role?.name, // Use currentUser instead of req.user
            deletedBy: deletedBy,
          },
        });
        throw ApiError.notFound("Employee not found");
      }

      // Authorization check - ADMIN aur employee dono delete kar sakte hain
      const isAdmin = currentUser?.role?.name === "ADMIN";
      const isEmployee = currentUser?.role?.type === "employee";

      // ADMIN aur employee dono ko full access hai employee delete karne ka
      if (!isAdmin && !isEmployee) {
        await AuditLogService.createAuditLog({
          userId: deletedBy,
          action: "EMPLOYEE_DELETION_FAILED",
          entityType: "EMPLOYEE",
          entityId: employeeId,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "INSUFFICIENT_PERMISSIONS",
            roleName: currentUser?.role?.name, // Use currentUser instead of req.user
            roleType: currentUser?.role?.type,
            deletedBy: deletedBy,
          },
        });
        throw ApiError.forbidden(
          "Only administrators and employees can permanently delete employees"
        );
      }

      // Ensure we're only deleting employees
      if (employee.role.type !== "employee") {
        await AuditLogService.createAuditLog({
          userId: deletedBy,
          action: "EMPLOYEE_DELETION_FAILED",
          entityType: "EMPLOYEE",
          entityId: employeeId,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "NON_EMPLOYEE_DELETION",
            roleName: currentUser?.role?.name, // Use currentUser instead of req.user
            deletedBy: deletedBy,
          },
        });
        throw ApiError.badRequest("Can only delete employee accounts");
      }

      // Optional: Check if employee has any important relationships
      // that might need to be handled before deletion
      const hasSubordinates = await Prisma.user.findFirst({
        where: { parentId: employeeId },
      });

      if (hasSubordinates) {
        await AuditLogService.createAuditLog({
          userId: deletedBy,
          action: "EMPLOYEE_DELETION_FAILED",
          entityType: "EMPLOYEE",
          entityId: employeeId,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "EMPLOYEE_HAS_SUBORDINATES",
            roleName: currentUser?.role?.name, // Use currentUser instead of req.user
            deletedBy: deletedBy,
          },
        });
        throw ApiError.conflict(
          "Cannot delete employee who has subordinates. Please reassign subordinates first."
        );
      }

      // Use transaction for atomic deletion
      const result = await Prisma.$transaction(async (tx) => {
        // 1. Delete all employee permissions
        await tx.employeePermission.deleteMany({
          where: { userId: employeeId },
        });

        // 2. Delete profile image from S3 if exists
        if (employee.profileImage) {
          try {
            await S3Service.delete({ fileUrl: employee.profileImage });
          } catch (s3Error) {
            console.warn("Failed to delete profile image from S3:", s3Error);
            // Continue with deletion even if S3 deletion fails
          }
        }

        // 3. Permanently delete the employee
        const deletedEmployee = await tx.user.delete({
          where: { id: employeeId },
          include: {
            role: { select: this.roleSelectFields },
          },
        });

        return deletedEmployee;
      });

      // Create audit log
      await AuditLogService.createAuditLog({
        userId: deletedBy,
        action: "EMPLOYEE_PERMANENTLY_DELETED",
        entityType: "EMPLOYEE",
        entityId: employeeId,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          employeeEmail: employee.email,
          employeeRole: employee.role.name,
          deletionReason: reason,
          roleName: currentUser?.role?.name, // Use currentUser instead of req.user
          roleType: currentUser?.role?.type,
          deletedBy: deletedBy,
          isAdminAction: isAdmin,
          isEmployeeAction: isEmployee,
        },
      });
      return {
        success: true,
        message: "Employee permanently deleted successfully",
        deletedEmployee: {
          id: result.id,
          email: result.email,
          username: result.username,
          role: result.role.name,
        },
        deletionDetails: {
          deletedBy: currentUser.id,
          reason: reason,
          timestamp: new Date(),
          deletedByRole: currentUser.role.name,
          deletedByRoleType: currentUser.role.type,
        },
      };
    } catch (error) {
      console.error("Employee deletion error:", error);

      if (error instanceof ApiError) {
        throw error;
      }

      // Handle Prisma errors
      if (error.code === "P2025") {
        await AuditLogService.createAuditLog({
          userId: deletedBy,
          action: "EMPLOYEE_DELETION_FAILED",
          entityType: "EMPLOYEE",
          entityId: employeeId,
          ipAddress: req ? Helper.getClientIP(req) : null,
          metadata: {
            ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
            reason: "EMPLOYEE_NOT_FOUND_OR_ALREADY_DELETED",
            roleName: currentUser?.role?.name, // Use currentUser instead of req.user
            deletedBy: deletedBy,
          },
        });
        throw ApiError.notFound("Employee not found or already deleted");
      }

      await AuditLogService.createAuditLog({
        userId: deletedBy,
        action: "EMPLOYEE_DELETION_FAILED",
        entityType: "EMPLOYEE",
        entityId: employeeId,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "UNKNOWN_ERROR",
          error: error.message,
          roleName: currentUser?.role?.name, // Use currentUser instead of req.user
          deletedBy: deletedBy,
        },
      });
      throw ApiError.internal("Failed to delete employee permanently");
    }
  }

  // GET EMPLOYEE BY ID
  static async getEmployeeById(employeeId, currentUser) {
    const user = await Prisma.user.findUnique({
      where: { id: employeeId },
      include: {
        EmployeePermissionsOwned: {
          where: { isActive: true },
          select: { permission: true, assignedAt: true },
        },
        role: { select: this.roleSelectFields },
        parent: { select: this.userSelectFields },
      },
    });

    if (!user) throw ApiError.notFound("Employee not found");
    if (user.role.type !== "employee") {
      throw ApiError.badRequest("User is not an employee");
    }

    return this.sanitizeUserData(user, currentUser);
  }

  // GET ALL EMPLOYEES BY PARENT ID (FIXED - Only active permissions)
  static async getAllEmployeesByParentId(parentId, options = {}) {
    const {
      page = 1,
      limit = 10,
      sort = "desc",
      status = "ALL",
      search = "",
    } = options;

    const skip = (page - 1) * limit;

    // Get parent user with role information
    const parent = await Prisma.user.findUnique({
      where: { id: parentId },
      include: { role: true },
    });

    if (!parent) {
      throw ApiError.notFound("Parent user not found");
    }

    let targetParentId = parentId;
    let whereConditions = {
      role: { type: "employee" },
      deletedAt: null,
    };

    // If parent is employee, use admin's ID instead
    if (parent.role?.type === "employee") {
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

      targetParentId = adminUser.id;
    }

    // Build query based on user role
    if (parent.role?.name === "ADMIN" || parent.role?.type === "employee") {
      // For ADMIN and employee users, show all employees (no parent filter)
      whereConditions = {
        ...whereConditions,
        // No parentId filter for admin and employee
      };
    } else {
      // For other users, show only their children
      whereConditions = {
        ...whereConditions,
        parentId: targetParentId,
      };
    }

    // Add status filter
    if (status !== "ALL") {
      whereConditions.status = status;
    }

    // Add search filter
    if (search.trim()) {
      const searchTerm = `%${search.toLowerCase()}%`;
      whereConditions.OR = [
        { username: { contains: searchTerm, mode: "insensitive" } },
        { firstName: { contains: searchTerm, mode: "insensitive" } },
        { lastName: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { phoneNumber: { contains: searchTerm } },
      ];
    }

    const [users, total] = await Promise.all([
      Prisma.user.findMany({
        where: whereConditions,
        include: {
          role: { select: this.roleSelectFields },
          parent: { select: this.userSelectFields },
          EmployeePermissionsOwned: {
            where: { isActive: true }, // ONLY ACTIVE PERMISSIONS
            select: { permission: true, isActive: true },
          },
        },
        orderBy: { createdAt: sort },
        skip,
        take: limit,
      }),
      Prisma.user.count({ where: whereConditions }),
    ]);

    const safeUsers = users.map((user) =>
      this.sanitizeUserData(user, parent.role)
    );

    return {
      users: safeUsers,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      meta: {
        parentRole: parent.role.name,
        parentRoleType: parent.role.type,
        isEmployeeViewingAdminData: parent.role?.type === "employee",
        targetParentId: targetParentId,
      },
    };
  }

  // PERMISSION CHECK METHODS
  static async checkPermission(userId, permission) {
    const userPermission = await Prisma.employeePermission.findFirst({
      where: {
        userId,
        permission,
        isActive: true,
      },
    });

    return !!userPermission;
  }

  static async checkPermissions(userId, permissions) {
    const userPermissions = await Prisma.employeePermission.findMany({
      where: {
        userId,
        permission: { in: permissions },
        isActive: true,
      },
      select: { permission: true },
    });

    const userPermissionSet = new Set(userPermissions.map((p) => p.permission));

    const result = {};
    permissions.forEach((permission) => {
      result[permission] = userPermissionSet.has(permission);
    });

    return {
      hasAll: permissions.every((p) => userPermissionSet.has(p)),
      hasAny: permissions.some((p) => userPermissionSet.has(p)),
      permissions: result,
      granted: Array.from(userPermissionSet),
      missing: permissions.filter((p) => !userPermissionSet.has(p)),
    };
  }

  // STATUS MANAGEMENT METHODS
  static async deactivateEmployee(
    employeeId,
    deactivatedBy,
    reason,
    req = null,
    res = null
  ) {
    return this.updateEmployeeStatus(
      employeeId,
      deactivatedBy,
      "IN_ACTIVE",
      "EMPLOYEE_DEACTIVATED",
      reason,
      req,
      res
    );
  }

  static async reactivateEmployee(employeeId, reactivatedBy, reason, req, res) {
    return this.updateEmployeeStatus(
      employeeId,
      reactivatedBy,
      "ACTIVE",
      "EMPLOYEE_ACTIVATED",
      reason,
      req,
      res
    );
  }

  // HELPER METHODS
  static async validateEmployeeRole(roleId) {
    const role = await Prisma.role.findUnique({ where: { id: roleId } });
    if (!role) throw ApiError.badRequest("Invalid roleId");
    if (role.type !== "employee") {
      throw ApiError.badRequest("Only employee type roles can be assigned");
    }
    return role;
  }

  static async checkExistingUser({ email, phoneNumber, username }) {
    const existingUser = await Prisma.user.findFirst({
      where: {
        OR: [{ email }, { phoneNumber }, { username }],
      },
    });

    if (existingUser) {
      throw ApiError.badRequest("Employee already exists");
    }
  }

  static async setupHierarchy(parentId) {
    if (!parentId) return { hierarchyLevel: 0, hierarchyPath: "" };

    const parent = await Prisma.user.findUnique({
      where: { id: parentId },
      include: { role: true },
    });

    if (!parent) throw ApiError.badRequest("Invalid parentId");

    // FIXED: ADMIN aur employee dono create kar sakte hain
    const isAdmin = parent.role.name === "ADMIN";
    const isEmployee = parent.role.type === "employee";

    if (!isAdmin && !isEmployee) {
      throw ApiError.forbidden(
        "Only admin and employee users can create employees"
      );
    }

    return {
      hierarchyLevel: parent.hierarchyLevel + 1,
      hierarchyPath: parent.hierarchyPath
        ? `${parent.hierarchyPath}/${parentId}`
        : `${parentId}`,
    };
  }

  static async handleProfileImageUpload(profileImage) {
    if (!profileImage) return "";

    try {
      return (await S3Service.upload(profileImage, "profile")) ?? "";
    } catch (uploadErr) {
      console.warn("Profile image upload failed:", uploadErr);
      return "";
    }
  }

  static async sendEmployeeCredentials(user, password, permissions) {
    await sendCredentialsEmail(
      user,
      password,
      null,
      "created",
      `Your employee account has been created by admin. You have been assigned the role: ${user.role.name}`,
      "employee",
      {
        role: user.role.name,
        permissions: permissions,
      }
    );
  }

  static async authorizeEmployeeUpdate(
    currentUser,
    userToUpdate,
    userId,
    email,
    roleId
  ) {
    const isAdmin = currentUser.role.name === "ADMIN";
    const isUpdatingOwnProfile = userId === currentUser.id;

    if (!isUpdatingOwnProfile && !isAdmin) {
      const canUpdate = await this.checkPermission(
        currentUser.id,
        "UPDATE_EMPLOYEE"
      );
      if (!canUpdate) {
        throw ApiError.forbidden(
          "You don't have permission to update this employee"
        );
      }
    }

    if (email && email !== userToUpdate.email && !isAdmin) {
      const permissionCheck = await this.checkPermissions(currentUser.id, [
        "UPDATE_EMPLOYEE_EMAIL",
        "FULL_EMPLOYEE_ACCESS",
      ]);
      if (!permissionCheck.hasAny) {
        throw ApiError.forbidden(
          "You don't have permission to update email addresses"
        );
      }
    }

    if (roleId && !isAdmin) {
      throw ApiError.forbidden("Only administrators can change employee roles");
    }
  }

  static async checkUniqueConstraints(userId, fields) {
    const { username, phoneNumber, email } = fields;
    const conditions = [];

    if (username) conditions.push({ username });
    if (phoneNumber) conditions.push({ phoneNumber });
    if (email) conditions.push({ email });

    if (conditions.length === 0) return;

    const existingUser = await Prisma.user.findFirst({
      where: {
        AND: [{ id: { not: userId } }, { OR: conditions }],
      },
    });

    if (existingUser) {
      if (existingUser.username === username)
        throw ApiError.badRequest("Username already taken");
      if (existingUser.phoneNumber === phoneNumber)
        throw ApiError.badRequest("Phone number already registered");
      if (existingUser.email === email)
        throw ApiError.badRequest("Email already registered");
    }
  }

  static buildUpdatePayload(fields, isAdmin) {
    const { username, firstName, lastName, phoneNumber, email, roleId } =
      fields;
    const payload = {};

    if (username) payload.username = username.trim();
    if (firstName) payload.firstName = this.formatName(firstName);
    if (lastName) payload.lastName = this.formatName(lastName);
    if (phoneNumber) payload.phoneNumber = phoneNumber;
    if (email) payload.email = email.trim().toLowerCase();
    if (roleId && isAdmin) payload.roleId = roleId;

    return payload;
  }

  static sanitizeUserData(user, currentUserRole) {
    const serialized = Helper.serializeUser(user);

    // ADMIN can see decrypted passwords
    if (
      currentUserRole.name === "ADMIN" ||
      currentUserRole.type === "employee"
    ) {
      if (serialized.password) {
        try {
          serialized.password = CryptoService.decrypt(serialized.password);
        } catch {
          serialized.password = "Error decrypting";
        }
      }
      const { transactionPin, refreshToken, ...safeData } = serialized;
      return safeData;
    }

    // For employee and other users, remove sensitive data
    const { password, transactionPin, refreshToken, ...safeData } = serialized;
    return safeData;
  }

  static async updateEmployeeStatus(
    employeeId,
    changedBy,
    status,
    action,
    reason,
    req = null,
    res = null
  ) {
    const [user, changer] = await Promise.all([
      Prisma.user.findUnique({
        where: { id: employeeId },
        include: { role: true },
      }),
      Prisma.user.findUnique({
        where: { id: changedBy },
        include: { role: true },
      }),
    ]);

    if (!user) {
      await AuditLogService.createAuditLog({
        userId: changedBy,
        action: `${action}_FAILED`,
        entityType: "EMPLOYEE",
        entityId: employeeId,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "EMPLOYEE_NOT_FOUND",
          roleName: changer?.role?.name, // Use changer instead of req.user
          changedBy: changedBy,
        },
      });
      throw ApiError.notFound("Employee not found");
    }

    if (user.role.type !== "employee") {
      await AuditLogService.createAuditLog({
        userId: changedBy,
        action: `${action}_FAILED`,
        entityType: "EMPLOYEE",
        entityId: employeeId,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "NOT_AN_EMPLOYEE",
          roleName: changer?.role?.name, // Use changer instead of req.user
          changedBy: changedBy,
        },
      });
      throw ApiError.badRequest(
        `Can only ${action.toLowerCase().split("_")[1]} employees`
      );
    }

    // Authorization check - ADMIN aur employee dono status change kar sakte hain
    const isAdmin = changer?.role?.name === "ADMIN";
    const isEmployee = changer?.role?.type === "employee";

    // ADMIN aur employee dono ko full access hai employee status change karne ka
    if (!isAdmin && !isEmployee) {
      await AuditLogService.createAuditLog({
        userId: changedBy,
        action: `${action}_FAILED`,
        entityType: "EMPLOYEE",
        entityId: employeeId,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "UNAUTHORIZED",
          roleName: changer?.role?.name, // Use changer instead of req.user
          roleType: changer?.role?.type,
          changedBy: changedBy,
        },
      });
      throw ApiError.forbidden(
        `Only administrators and employees can ${action.toLowerCase().split("_")[1]} employees`
      );
    }

    if (user.status === status) {
      await AuditLogService.createAuditLog({
        userId: changedBy,
        action: `${action}_FAILED`,
        entityType: "EMPLOYEE",
        entityId: employeeId,
        ipAddress: req ? Helper.getClientIP(req) : null,
        metadata: {
          ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
          reason: "ALREADY_IN_STATE",
          currentStatus: user.status,
          attemptedStatus: status,
          roleName: changer?.role?.name, // Use changer instead of req.user
          changedBy: changedBy,
        },
      });
      throw ApiError.badRequest(
        `Employee is already ${status === "ACTIVE" ? "active" : "deactivated"}`
      );
    }

    const updatedUser = await Prisma.user.update({
      where: { id: employeeId },
      data: {
        status,
        deactivationReason: reason,
        updatedAt: new Date(),
      },
      include: {
        role: { select: this.roleSelectFields },
        parent: { select: this.userSelectFields },
      },
    });

    await AuditLogService.createAuditLog({
      userId: changedBy,
      action: action,
      entityType: "EMPLOYEE",
      entityId: employeeId,
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
        previousStatus: user.status,
        newStatus: status,
        reason: reason || "No reason provided",
        roleName: changer?.role?.name, // Use changer instead of req.user
        roleType: changer?.role?.type,
        changedBy: changedBy,
        isAdminAction: isAdmin,
        isEmployeeAction: isEmployee,
      },
    });

    return updatedUser;
  }

  static async regenerateCredentialsAndNotify(userId, newEmail) {
    const generatedPassword = Helper.generatePassword();
    const hashedPassword = CryptoService.encrypt(generatedPassword);

    const user = await Prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        email: newEmail,
      },
      include: { role: true },
    });

    const permissions = await this.getEmployeePermissions(userId);

    await sendCredentialsEmail(
      user,
      generatedPassword,
      null,
      "updated",
      `Your employee account credentials have been updated. Here are your new login credentials.`,
      "employee",
      {
        role: user.role.name,
        permissions: permissions,
      }
    );

    // Audit log for credential regeneration
    await AuditLogService.createAuditLog({
      userId: currentUserId,
      action: "EMPLOYEE_CREDENTIALS_REGENERATED",
      entityType: "EMPLOYEE",
      entityId: userId,
      ipAddress: req ? Helper.getClientIP(req) : null,
      metadata: {
        ...(req && res ? Helper.generateCommonMetadata(req, res) : {}),
        newEmail: newEmail,
        roleName: req?.user?.role,
        regeneratedBy: currentUserId,
      },
    });

    return user;
  }

  static formatName(name) {
    if (!name) return name;
    return name
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
      .trim();
  }
}

export default EmployeeServices;
