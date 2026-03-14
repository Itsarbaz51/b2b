import { v4 as uuidv4 } from "uuid";
import Prisma from "../db/db.js";
import { UAParser } from "ua-parser-js";

export class LoginLogService {
  static async createLoginLog({
    userId,
    domainName,
    ipAddress,
    userAgent = "",
    roleType,
    latitude = null,
    longitude = null,
    location = null,
    accuracy = null,
  }) {
    const loginLogData = {
      id: uuidv4(),
      userId,
      domainName,
      ipAddress: String(ipAddress),
      userAgent,
      roleType,
      latitude,
      longitude,
      location,
      accuracy,
      message: "LOGIN_EVENT",
      level: "info",
    };

    // save in DB
    const savedLog = await Prisma.loginEvent.create({
      data: loginLogData,
    });

    return savedLog;
  }

  static async getAllLoginLogs(payload, currentUser) {
    const {
      page = 1,
      limit = 10,
      userId,
      roleId,
      search,
      deviceType,
      sort = "desc",
      sortBy = "createdAt",
    } = payload;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const skip = (parsedPage - 1) * parsedLimit;

    const where = {};

    // ✅ Role-based access
    if (currentUser.role !== "ADMIN") {
      where.userId = currentUser.id;
    }

    if (userId) {
      where.userId = userId;
    }

    // ✅ Device type filter
    if (deviceType) {
      where.userAgent = {
        contains: deviceType,
        mode: "insensitive",
      };
    }

    // ✅ Count
    const total = await Prisma.loginEvent.count({ where });

    // ✅ Fetch logs from DB
    let logs = await Prisma.loginEvent.findMany({
      where,
      skip,
      take: parsedLimit,
      orderBy: {
        [sortBy]: sort,
      },
    });

    // ✅ Get unique user IDs
    const userIds = [...new Set(logs.map((log) => log.userId))];

    // ✅ User filter
    let userWhereClause = {
      id: {
        in: userIds,
      },
    };

    if (roleId) {
      userWhereClause.roleId = roleId;
    }

    if (search) {
      const searchLower = search.toLowerCase();

      userWhereClause.OR = [
        { firstName: { contains: searchLower } },
        { lastName: { contains: searchLower } },
        { email: { contains: searchLower } },
        { username: { contains: searchLower } },
      ];
    }

    // ✅ Fetch users
    const users = await Prisma.user.findMany({
      where: userWhereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        role: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    });

    const filteredUserIds = new Set(users.map((user) => user.id));

    let filteredLogs = logs.filter((log) => filteredUserIds.has(log.userId));

    // ✅ Add userAgentSimple
    filteredLogs = filteredLogs.map((log) => {
      let userAgentSimple = null;

      if (log.userAgent) {
        const parser = new UAParser(log.userAgent);
        const result = parser.getResult();

        userAgentSimple = {
          device:
            result.device.type ||
            (result.device.model ? result.device.model : "Desktop"),
          browser: result.browser.name || "Unknown",
          os: result.os.name || "Unknown",
        };
      }

      return {
        ...log,
        userAgentSimple,
      };
    });

    // ✅ Create user map
    const userMap = {};
    for (const user of users) {
      userMap[user.id] = user;
    }

    // ✅ Merge user data
    filteredLogs = filteredLogs.map((log) => ({
      ...log,
      user: userMap[log.userId] || null,
    }));

    return {
      success: true,
      data: filteredLogs,
      metadata: {
        pagination: {
          currentPage: parsedPage,
          totalPages: Math.ceil(total / parsedLimit),
          totalItems: total,
          itemsPerPage: parsedLimit,
          hasNext: parsedPage < Math.ceil(total / parsedLimit),
          hasPrev: parsedPage > 1,
          showingFrom: skip + 1,
          showingTo: Math.min(skip + parsedLimit, total),
        },
      },
    };
  }
}

export default LoginLogService;
