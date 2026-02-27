import AuditLogService from "../services/auditLog.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/AsyncHandler.js";

class AuditLogsController {
  static getAuditLogs = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, ...filters } = req.body;

    // Role type directly pass karo service ko
    const userRoleType = req.user?.role?.type; // Yehi important hai
    const userId = req.user?.id;

   
    if (!userId) {
      throw new ApiError("User not authenticated", 401);
    }

    const parsedPage = Number(page) > 0 ? parseInt(page, 10) : 1;
    const parsedLimit = Number(limit) > 0 ? parseInt(limit, 10) : 10;

    const result = await AuditLogService.getAuditLogs({
      page: parsedPage,
      limit: parsedLimit,
      filters,
      userRole: userRoleType, // Role type pass karo
      userId,
    });

    return res
      .status(200)
      .json(
        ApiResponse.success(result, "Audit logs fetched successfully", 200)
      );
  });
}

export default AuditLogsController;
