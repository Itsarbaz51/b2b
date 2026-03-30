import ReportService from "../services/reports/report.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export default class ReportController {
  static async getReports(req, res) {
    const role = req.user?.role;
    const userId = req.user?.id;

    const queryUserId = req.query.userId;
    const serviceWise = req.query.service === "true";

    let data;
    let type;

    // USER FLOW
    if (role !== "ADMIN") {
      if (serviceWise) {
        data = await ReportService.getServiceReport({ userId });
      } else {
        data = await ReportService.getUserReport({ userId });
      }

      type = "USER_REPORT";
    }

    // ADMIN FLOW
    else {
      if (queryUserId) {
        //  admin viewing specific user
        if (serviceWise) {
          data = await ReportService.getServiceReport({
            userId: queryUserId,
          });
        } else {
          data = await ReportService.getUserReport({
            userId: queryUserId,
          });
        }

        type = "ADMIN_USER_REPORT";
      } else {
        //  admin overall
        if (serviceWise) {
          data = await ReportService.getServiceReport({});
        } else {
          data = await ReportService.getAdminReport();
        }

        type = "ADMIN_REPORT";
      }
    }

    return res.status(200).json(ApiResponse.success(data, `All ${type}`));
  }
}
