import { ApiError } from "../utils/ApiError.js";
import loginLogger from "../utils/logger.js";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";
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
    try {
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
      };

      loginLogger.info("LOGIN_EVENT", loginLogData);

      return loginLogData;
    } catch (error) {
      throw ApiError.internal("Failed to create login log:", error.message);
    }
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

    const logFilePath = path.join(process.cwd(), "logs", "loginLogs.log");

    // ✅ If file does not exist
    if (!fs.existsSync(logFilePath)) {
      return {
        success: true,
        data: [],
        metadata: {
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: parseInt(limit),
            hasNext: false,
            hasPrev: false,
            showingFrom: 0,
            showingTo: 0,
          },
        },
      };
    }

    // ✅ Read log file
    const logData = fs.readFileSync(logFilePath, "utf8");
    const logLines = logData.split("\n").filter((line) => line.trim());

    let allLogs = [];
    for (const line of logLines) {
      try {
        const logEntry = JSON.parse(line);

        if (logEntry.message === "LOGIN_EVENT" && logEntry.data) {
          allLogs.push({
            ...logEntry.data,
            createdAt: new Date(logEntry.timestamp || logEntry.data.createdAt),
          });
        } else if (logEntry.userId) {
          allLogs.push({
            ...logEntry,
            createdAt: new Date(logEntry.timestamp || logEntry.createdAt),
          });
        }
      } catch (err) {
        console.warn("Failed to parse log line:", line);
      }
    }

    // ✅ Role-based access
    if (currentUser.role !== "ADMIN") {
      allLogs = allLogs.filter((log) => log.userId === currentUser.id);
    }

    // ✅ Get unique user IDs from logs for Prisma query
    const userIds = [...new Set(allLogs.map((log) => log.userId))];

    // ✅ Build Prisma where clause for user search
    let userWhereClause = {
      id: {
        in: userIds,
      },
    };

    // ✅ Add roleId filter if provided
    if (roleId) {
      userWhereClause.roleId = roleId;
    }

    // ✅ Add search filter if provided - YAHAN SEARCH PRISMA SE HOGI
    if (search) {
      const searchLower = search.toLowerCase();
      userWhereClause.OR = [
        { firstName: { contains: searchLower } },
        { lastName: { contains: searchLower } },
        { email: { contains: searchLower } },
        { username: { contains: searchLower } },
      ];
    }

    // ✅ Fetch users with filters from Prisma
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

    // ✅ Apply device type filter on logs
    let filteredLogs = allLogs.filter((log) => filteredUserIds.has(log.userId));

    if (deviceType) {
      filteredLogs = filteredLogs.filter((log) => {
        if (!log.userAgent) return false;
        const parser = new UAParser(log.userAgent);
        const result = parser.getResult();

        // Determine if this is mobile or desktop
        const isMobile =
          result.device.type === "mobile" || result.device.type === "tablet";
        const normalizedDevice = isMobile ? "mobile" : "desktop";

        return normalizedDevice.toLowerCase() === deviceType.toLowerCase();
      });
    }

    // ✅ Inline helper: Sorting
    const applySorting = (logs) => {
      return logs.sort((a, b) => {
        const valA =
          a[sortBy] instanceof Date ? a[sortBy].getTime() : a[sortBy];
        const valB =
          b[sortBy] instanceof Date ? b[sortBy].getTime() : b[sortBy];
        if (valA < valB) return sort === "asc" ? -1 : 1;
        if (valA > valB) return sort === "asc" ? 1 : -1;
        return 0;
      });
    };

    // ✅ Apply sorting
    filteredLogs = applySorting(filteredLogs);

    // ✅ Pagination
    const total = filteredLogs.length;
    const skip = (page - 1) * limit;
    let paginatedLogs = filteredLogs.slice(skip, skip + parseInt(limit));

    // ✅ Add userAgentSimple
    paginatedLogs = paginatedLogs.map((log) => {
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

      return { ...log, userAgentSimple };
    });

    // ✅ Create user map for merging
    const userMap = {};
    for (const user of users) userMap[user.id] = user;

    // ✅ Merge user info
    paginatedLogs = paginatedLogs.map((log) => ({
      ...log,
      user: userMap[log.userId] || null,
    }));

    // ✅ Final response
    return {
      success: true,
      data: paginatedLogs,
      metadata: {
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNext: parseInt(page) < Math.ceil(total / limit),
          hasPrev: parseInt(page) > 1,
          showingFrom: skip + 1,
          showingTo: Math.min(skip + parseInt(limit), total),
        },
      },
    };
  }
}

export default LoginLogService;
