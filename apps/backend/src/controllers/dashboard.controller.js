import DashboardService from "../services/dashboard.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import Helper from "../utils/helper.js";

export default class DashboardController {
  static async getDashboard(req, res) {
    const userId = req.user.id;
    const role = req.user.role == "ADMIN" ? "ADMIN" : req.user.roleType;
    const { type, from, to, status } = req.query;

    const data = await DashboardService.getDashboard({
      userId,
      role,
      type,
      from,
      to,
      status,
    });

    return res
      .status(201)
      .json(
        ApiResponse.success(
          Helper.serializeBigInt(data),
          `fetch dashboard`,
          201
        )
      );
  }
}
