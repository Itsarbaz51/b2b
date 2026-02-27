import asyncHandler from "../utils/AsyncHandler.js";
import LoginLogService from "../services/loginLog.service.js";

class LoginLogController {
  static index = asyncHandler(async (req, res) => {
    const payload = {
      page: req.body.page || 1,
      limit: req.body.limit || 10,
      userId: req.body.userId || null,
      roleId: req.body.roleId || null,
      search: req.body.search || "",
      deviceType: req.body.deviceType || null,
      sort: req.body.sort || "desc",
      sortBy: req.body.sortBy || "createdAt",
    };

    const currentUser = {
      id: req.user.id,
      role: req.user.role,
    };

    const result = await LoginLogService.getAllLoginLogs(payload, currentUser);

    return res.status(200).json(result);
  });
}

export default LoginLogController;
