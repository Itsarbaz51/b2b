import prisma from "../db/db.js";
import ReportService from "../services/reports/report.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export default class ReportController {
  static async getReports(req, res) {
    const role = req.user?.role === "ADMIN" ? "ADMIN" : req.user?.roleType;

    const loggedInUserId = req.user?.id;

    const { service, search } = req.query;

    const isAdmin = role === "ADMIN";
    const isEmployee = role === "employee";

    let userIds = [];

    // 👤 USER
    if (!isAdmin && !isEmployee) {
      userIds = [loggedInUserId];
    }

    // 👑 ADMIN
    else if (isAdmin) {
      if (search) {
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ id: search }, { username: { contains: search } }],
          },
          select: { id: true },
        });

        if (!user) throw ApiError.notFound("User not found");

        userIds = [user.id]; // ✅ selected user
      } else {
        userIds = [loggedInUserId]; // ✅ ALL users (for service-wise default)
      }
    }

    // 🧑‍💼 EMPLOYEE
    else if (isEmployee) {
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (!admin) throw ApiError.notFound("Admin not found");

      userIds = [admin.id];
    }

    let data;

    // ✅ Toggle based only
    if (service === "true") {
      data = await ReportService.getServiceReport({ userIds });
    } else {
      data = await ReportService.getUserReport({ userIds });
    }

    return res.status(200).json(ApiResponse.success(data, "Reports fetched"));
  }
}
