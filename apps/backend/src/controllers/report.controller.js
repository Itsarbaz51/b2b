import prisma from "../db/db.js";
import ReportService from "../services/reports/report.service.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export default class ReportController {
  static async getReports(req, res) {
    const role = req.user?.role === "ADMIN" ? "ADMIN" : req.user?.roleType;

    const loggedInUserId = req.user?.id;

    const { userId, username, search, service } = req.query;

    const serviceWise = service === "true";

    const isAdmin = role === "ADMIN";
    const isEmployee = role === "employee";

    let userIds = [];

    // 🔹 HELPER → get downline (1 level)
    const getDownlineUserIds = async (parentId) => {
      const users = await prisma.user.findMany({
        where: {
          OR: [{ id: parentId }, { parentId: parentId }],
        },
        select: { id: true },
      });

      return users.map((u) => u.id);
    };

    // 👤 USER
    if (!isAdmin && !isEmployee) {
      userIds = [loggedInUserId];
    }

    // 🧑‍💼 EMPLOYEE → own + children
    else if (isEmployee) {
      userIds = await getDownlineUserIds(loggedInUserId);
    }

    // 👑 ADMIN
    else if (isAdmin) {
      if (userId || username || search) {
        let user;

        if (userId) {
          user = { id: userId };
        } else if (username) {
          user = await prisma.user.findUnique({
            where: { username },
            select: { id: true },
          });
        } else {
          user = await prisma.user.findFirst({
            where: {
              OR: [{ id: search }, { username: { contains: search } }],
            },
            select: { id: true },
          });
        }

        if (!user) throw ApiError.notFound("User not found");

        userIds = [user.id];
      } else {
        userIds = []; // all users
      }
    }

    let data;
    let type;

    // 🔹 USER / EMPLOYEE FLOW
    if (!isAdmin) {
      if (serviceWise) {
        data = await ReportService.getServiceReport({
          userIds,
        });
      } else {
        data = await ReportService.getUserReport({
          userIds,
        });
      }

      type = isEmployee ? "EMPLOYEE_REPORT" : "USER_REPORT";
    }

    // 🔹 ADMIN FLOW
    else {
      if (userIds.length > 0) {
        if (serviceWise) {
          data = await ReportService.getServiceReport({
            userIds,
          });
        } else {
          data = await ReportService.getUserReport({
            userIds,
          });
        }

        type = "ADMIN_USER_REPORT";
      } else {
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
  