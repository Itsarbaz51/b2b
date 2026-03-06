import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import EmployeeServices from "../services/employee.service.js";
import Helper from "../utils/helper.js";

class EmployeeController {
  // EMPLOYEE REGISTRATION
  static register = asyncHandler(async (req, res) => {
    const adminId = req.user?.id;
    if (!adminId) throw ApiError.unauthorized("Admin authentication required");

    const data = {
      ...req.body,
      permissions: req.body.permissions || [],
      profileImage: req.file?.path,
      parentId: adminId,
    };

    const { user, accessToken } = await EmployeeServices.register(
      data,
      req,
      res
    );

    const safeUser = Helper.serializeUser(user);

    return res.status(201).json(
      ApiResponse.success(
        {
          user: safeUser,
          accessToken,
          assignedPermissions: data.permissions,
        },
        `Employee created successfully with ${data.permissions.length} permissions`,
        201
      )
    );
  });

  // EMPLOYEE PROFILE UPDATE
  static updateProfile = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const currentUserId = req.user.id;

    if (!employeeId) throw ApiError.badRequest("Employee ID required");

    const user = await EmployeeServices.updateProfile(
      employeeId,
      req.body,
      currentUserId,
      req,
      res
    );

    // Fix: Change 'userreq' to 'user'
    const safeUser = Helper.serializeUser(user, req, res); // 'userreq' se change kiya 'user'

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { user: safeUser },
          "Employee profile updated successfully",
          200
        )
      );
  });
  // EMPLOYEE PROFILE IMAGE UPDATE
  static updateProfileImage = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;

    if (!req.file) throw ApiError.badRequest("Profile image is required");

    const user = await EmployeeServices.updateProfileImage(
      employeeId,
      req.file.path,
      req,
      res
    );

    const safeUser = Helper.serializeUser(user, req, res);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { user: safeUser },
          "Employee profile image updated successfully",
          200
        )
      );
  });

  // GET EMPLOYEE BY ID
  static getEmployeeById = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const currentUser = req.user;

    const user = await EmployeeServices.getEmployeeById(
      employeeId,
      currentUser
    );

    return res
      .status(200)
      .json(
        ApiResponse.success({ user }, "Employee fetched successfully", 200)
      );
  });

  // UPDATE EMPLOYEE PERMISSIONS
  static updatePermissions = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const adminId = req.user?.id;
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      throw ApiError.badRequest("Permissions array is required");
    }

    const result = await EmployeeServices.updateEmployeePermissions(
      employeeId,
      permissions,
      adminId,
      req,
      res
    );

    return res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          `Employee permissions updated successfully`,
          200
        )
      );
  });

  // GET EMPLOYEE PERMISSIONS
  static getPermissions = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;

    const permissions =
      await EmployeeServices.getEmployeePermissions(employeeId);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { permissions, count: permissions.length },
          "Employee permissions fetched successfully",
          200
        )
      );
  });

  // GET ALL EMPLOYEES BY PARENT ID
  static getAllEmployeesByParentId = asyncHandler(async (req, res) => {
    const parentId = req.user?.id;
    const {
      page = "1",
      limit = "10",
      sort = "desc",
      status = "ALL",
      search = "",
    } = req.query;

    const result = await EmployeeServices.getAllEmployeesByParentId(parentId, {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
      sort: sort.toLowerCase() === "asc" ? "asc" : "desc",
      status: status.toUpperCase(),
      search: search.trim(),
    });

    return res.status(200).json(
      ApiResponse.success(
        {
          users: result.users,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        },
        "Employees fetched successfully",
        200
      )
    );
  });

  // DEACTIVATE EMPLOYEE
  static deactivateEmployee = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const deactivatedBy = req.user?.id;
    const { reason } = req.body;

    const user = await EmployeeServices.deactivateEmployee(
      employeeId,
      deactivatedBy,
      reason,
      req,
      res
    );

    const safeUser = Helper.serializeUser(user);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { user: safeUser },
          "Employee deactivated successfully",
          200
        )
      );
  });

  // REACTIVATE EMPLOYEE
  static reactivateEmployee = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const reactivatedBy = req.user?.id;
    const { reason } = req.body;

    const user = await EmployeeServices.reactivateEmployee(
      employeeId,
      reactivatedBy,
      reason,
      req,
      res
    );

    const safeUser = Helper.serializeUser(user);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { user: safeUser },
          "Employee reactivated successfully",
          200
        )
      );
  });

  // DELETE EMPLOYEE
  static deleteEmployee = asyncHandler(async (req, res) => {
    const { employeeId } = req.params;
    const deletedBy = req.user?.id;
    const { reason } = req.body;

    await EmployeeServices.deleteEmployee(
      employeeId,
      deletedBy,
      reason,
      req,
      res
    );

    return res
      .status(200)
      .json(
        ApiResponse.success(
          null,
          "Employee permanently deleted successfully",
          200
        )
      );
  });

  // CHECK SINGLE PERMISSION
  static checkPermission = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { permission } = req.body;

    if (!permission) throw ApiError.badRequest("Permission is required");

    const hasPermission = await EmployeeServices.checkPermission(
      userId,
      permission
    );

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { hasPermission, userId, permission },
          "Permission check completed",
          200
        )
      );
  });

  // CHECK MULTIPLE PERMISSIONS
  static checkPermissions = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { permissions } = req.body;

    if (!permissions || !Array.isArray(permissions)) {
      throw ApiError.badRequest("Permissions array is required");
    }

    const result = await EmployeeServices.checkPermissions(userId, permissions);

    return res
      .status(200)
      .json(ApiResponse.success(result, "Permissions check completed", 200));
  });
}

export default EmployeeController;
