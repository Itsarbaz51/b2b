import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import UserServices from "../services/user.service.js";
import Helper from "../utils/helper.js";

class UserController {
  // BUSINESS USER REGISTRATION
  static register = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.internal("Parent id is missing");
    }

    const data = { ...req.body };

    if (req.file) {
      data.profileImage = req.file.path;
    }

    const { user, accessToken } = await UserServices.register(
      {
        ...data,
        parentId: userId,
      },
      req,
      res
    );

    if (!user || !accessToken) {
      throw ApiError.internal("Business user creation failed!");
    }

    const safeUser = Helper.serializeUser(user);

    return res
      .status(201)
      .json(
        ApiResponse.success(
          { user: safeUser, accessToken },
          "Business user created successfully",
          201
        )
      );
  });

  // BUSINESS USER PROFILE UPDATE
  static updateProfile = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (!currentUserId) {
      throw ApiError.unauthorized("User not authenticated");
    }

    const updateData = req.body;
    const user = await UserServices.updateProfile(
      userId,
      updateData,
      currentUserId,
      req,
      res
    );

    const safeUser = Helper.serializeUser(user);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { user: safeUser },
          "Business profile updated successfully",
          200
        )
      );
  });

  // BUSINESS USER PROFILE IMAGE UPDATE
  static updateProfileImage = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!req.file) {
      throw ApiError.badRequest("Profile image is required");
    }

    const user = await UserServices.updateProfileImage(
      userId,
      req.file.path,
      req,
      res
    );

    const safeUser = Helper.serializeUser(user);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { user: safeUser },
          "Business profile image updated successfully",
          200
        )
      );
  });

  // GET BUSINESS USER BY ID
  static getUserById = asyncHandler(async (req, res) => {
    const userId = req.params.id;
    const currentUser = req.user;

    if (!userId) {
      throw ApiError.badRequest("userId required");
    }

    const user = await UserServices.getUserById(userId, currentUser, req, res);

    return res
      .status(200)
      .json(ApiResponse.success({ user }, "Business user fetched", 200));
  });

  // GET CURRENT BUSINESS USER
  static getCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized("User not authenticated");
    }
    try {
      const safeUser = await UserServices.getUserById(userId);

      if (!safeUser) {
        throw ApiError.notFound("Business user not found");
      }

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { user: safeUser },
            "Current business user fetched",
            200
          )
        );
    } catch (error) {
      console.error("Error fetching current business user:", error);
      throw ApiError.internal("Failed to fetch business user data");
    }
  });

  // GET ALL BUSINESS USERS BY ROLE
  static getAllUsersByRole = asyncHandler(async (req, res) => {
    const { roleId } = req.params;

    if (!roleId) {
      throw ApiError.badRequest("roleId is required");
    }

    const users = await UserServices.getAllUsersByRole(roleId);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { users },
          "Business users fetched successfully",
          200
        )
      );
  });

  // GET ALL BUSINESS USERS BY PARENT ID
  static getAllRoleTypeUsersByParentId = asyncHandler(async (req, res) => {
    const parentId = req.user?.id;

    if (!parentId) {
      throw ApiError.unauthorized("User not authenticated");
    }

    const {
      page = "1",
      limit = "10",
      sort = "desc",
      status = "ALL",
      search = "",
    } = req.query;

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = parseInt(limit, 10) || 10;
    const parsedSort = sort.toLowerCase() === "asc" ? "asc" : "desc";

    const allowedStatuses = ["ALL", "ACTIVE", "IN_ACTIVE", "DELETED"];
    const upperStatus = (status || "ALL").toUpperCase();

    const parsedStatus = allowedStatuses.includes(upperStatus)
      ? upperStatus
      : "ALL";

    const { users, total } = await UserServices.getAllRoleTypeUsersByParentId(
      parentId,
      {
        page: parsedPage,
        limit: parsedLimit,
        sort: parsedSort,
        status: parsedStatus,
        search: search,
      }
    );

    return res.status(200).json(
      ApiResponse.success(
        {
          users,
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit),
        },
        "Business users fetched successfully",
        200
      )
    );
  });

  // GET ALL BUSINESS USERS BY CHILDREN ID
  static getAllUsersByChildrenId = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
      throw ApiError.badRequest("userId is required");
    }

    const users = await UserServices.getAllUsersByChildrenId(userId);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { users },
          "Business children users fetched successfully",
          200
        )
      );
  });

  // GET BUSINESS USERS COUNT BY PARENT ID
  static getAllUsersCountByParentId = asyncHandler(async (req, res) => {
    const { parentId } = req.params;

    if (!parentId) {
      throw ApiError.badRequest("parentId is required");
    }

    const result = await UserServices.getAllUsersCountByParentId(parentId);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          "Business users count fetched successfully",
          200
        )
      );
  });

  // GET BUSINESS USERS COUNT BY CHILDREN ID
  static getAllUsersCountByChildrenId = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
      throw ApiError.badRequest("userId is required");
    }

    const result = await UserServices.getAllUsersCountByChildrenId(userId);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          "Business children count fetched successfully",
          200
        )
      );
  });

  // DEACTIVATE BUSINESS USER
  static deactivateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const deactivatedBy = req.user?.id;
    const { reason } = req.body;

    if (!deactivatedBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!userId) {
      throw ApiError.badRequest("Business User ID is required");
    }

    try {
      const user = await UserServices.deactivateUser(
        userId,
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
            "Business user deactivated successfully",
            200
          )
        );
    } catch (error) {
      console.error("Controller error in deactivateUser:", error);
      throw error;
    }
  });

  // REACTIVATE BUSINESS USER
  static reactivateUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const reactivatedBy = req.user?.id;
    const { reason } = req.body;

    if (!reactivatedBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!userId) {
      throw ApiError.badRequest("Business User ID is required");
    }

    try {
      const user = await UserServices.reactivateUser(
        userId,
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
            "Business user reactivated successfully",
            200
          )
        );
    } catch (error) {
      console.error("Controller error in reactivateUser", error);
      throw error;
    }
  });

  // DELETE BUSINESS USER
  static deleteUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const deletedBy = req.user?.id;
    const { reason } = req.body;

    if (!deletedBy) {
      throw ApiError.unauthorized("User not authenticated");
    }

    if (!userId) {
      throw ApiError.badRequest("Business User ID is required");
    }

    try {
      const user = await UserServices.deleteUser(
        userId,
        deletedBy,
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
            "Business user deleted successfully",
            200
          )
        );
    } catch (error) {
      console.error("Controller error in deleteUser:", error);
      throw error;
    }
  });
}

export default UserController;
