import DashboardService from "../services/dashboard.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export default class DashboardController {
  static async getDashboard(req, res) {
    const userId = req.user.id;
    const role = req.user.role?.name || req.user.role;
    const { range, status } = req.query;

    const data = await DashboardService.getDashboard({
      userId,
      role,
      range,
      status,
    });

    return res
      .status(201)
      .json(ApiResponse.success(data, `fetch dashboard`, 201));
  }
}
