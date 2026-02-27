import asyncHandler from "../utils/AsyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import RoleServices from "../services/role.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

class RoleController {
  static getAllRoles = asyncHandler(async (req, res) => {
    const userRoleLevel = req.user?.roleLevel;

    const options = {
      ...(typeof userRoleLevel === "number" && {
        currentUserRoleLevel: userRoleLevel,
      }),
      excludeAdmin: true, // Exclude ADMIN role
    };

    const roles = await RoleServices.getAllRoles(options);

    return res
      .status(200)
      .json(
        ApiResponse.success(roles, "All non-admin roles fetched successfully")
      );
  });

  static getAllRolesByType = asyncHandler(async (req, res) => {
    const currentUser = req.user;
    const { type } = req.params;

    if (!type || !["employee", "business"].includes(type)) {
      return res
        .status(400)
        .json(
          ApiError.badRequest(
            "Invalid type parameter. Must be 'employee' or 'business'",
            400
          )
        );
    }

    const options = {
      currentUserRoleLevel: currentUser?.roleLevel,
      type: type,
      currentUser: {
        id: currentUser?.id,
        role: {
          type: currentUser?.roleType,
          name: currentUser?.role,
          level: currentUser?.roleLevel,
        },
      },
    };

    const roles = await RoleServices.getAllRolesByType(options);

    const message =
      type === "employee"
        ? "Employee roles fetched successfully"
        : "Business roles fetched successfully";

    return res.status(200).json(ApiResponse.success(roles, message, 200));
  });

  static createRole = asyncHandler(async (req, res) => {
    const createdBy = req.user?.id;
    const userRoleLevel = req.user?.roleLevel;

    if (!createdBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (userRoleLevel === undefined) {
      throw ApiError.forbidden("Insufficient permissions");
    }

    // Check if user can create roles with the requested level
    const { level, type = "employee" } = req.body;

    // TYPE VALIDATION: Only allow creating 'employee' type roles
    if (type !== "employee") {
      throw ApiError.badRequest("Only 'employee' type roles can be created");
    }

    if (level !== undefined && level <= userRoleLevel) {
      throw ApiError.forbidden("Cannot create role with equal or lower level");
    }

    const role = await RoleServices.createRole(
      {
        ...req.body,
        type,
        createdBy,
      },
      req,
      res
    );

    return res
      .status(201)
      .json(
        ApiResponse.success(role, "Employee role created successfully", 201)
      );
  });

  static updateRole = asyncHandler(async (req, res) => {
    const updatedBy = req.user?.id;
    const userRoleLevel = req.user?.roleLevel;
    const roleId = req.params.id;

    if (!updatedBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!roleId) {
      throw ApiError.badRequest("Role ID is required");
    }

    if (userRoleLevel === undefined) {
      throw ApiError.forbidden("Insufficient permissions");
    }

    // Get the existing role to check its level and type
    const existingRole = await RoleServices.getRolebyId(roleId);

    if (!existingRole) {
      throw ApiError.notFound("Role not found");
    }

    // TYPE CHECK: Only allow updating 'employee' type roles
    if (existingRole.type !== "employee") {
      throw ApiError.forbidden("Cannot update non-employee type roles");
    }

    // Check if user can update this role
    if (existingRole.level <= userRoleLevel) {
      throw ApiError.forbidden("Cannot update role with equal or lower level");
    }

    // Check if trying to update level to invalid value
    const { level, type } = req.body;

    // Prevent changing type to 'business'
    if (type && type !== "employee") {
      throw ApiError.badRequest("Cannot change role type to non-employee");
    }

    if (level !== undefined && level <= userRoleLevel) {
      throw ApiError.forbidden(
        "Cannot set role level to equal or lower than your own"
      );
    }

    const role = await RoleServices.updateRole(
      roleId,
      {
        ...req.body,
        updatedBy,
        // Ensure type remains 'employee'
        type: "employee",
      },
      req,
      res
    );

    return res
      .status(200)
      .json(
        ApiResponse.success(role, "Employee role updated successfully", 200)
      );
  });

  static deleteRole = asyncHandler(async (req, res) => {
    const userRoleLevel = req.user?.roleLevel;
    const roleId = req.params.id;

    if (!roleId) {
      throw ApiError.badRequest("Role ID is required");
    }

    if (userRoleLevel === undefined) {
      throw ApiError.forbidden("Insufficient permissions");
    }

    // Get the existing role to check its level and type
    const existingRole = await RoleServices.getRolebyId(roleId);
    if (!existingRole) {
      throw ApiError.notFound("Role not found");
    }

    // TYPE CHECK: Only allow deleting 'employee' type roles
    if (existingRole.type !== "employee") {
      throw ApiError.forbidden("Cannot delete non-employee type roles");
    }

    // Check if user can delete this role
    if (existingRole.level <= userRoleLevel) {
      throw ApiError.forbidden("Cannot delete role with equal or lower level");
    }

    const result = await RoleServices.deleteRole(roleId, req, res);

    if (!result) {
      throw ApiError.notFound("Role not found or delete failed");
    }

    return res
      .status(200)
      .json(
        ApiResponse.success(null, "Employee role deleted successfully", 200)
      );
  });
}

export default RoleController;
