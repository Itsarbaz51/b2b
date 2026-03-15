import { ApiError } from "../utils/ApiError.js";
import { v4 as uuidv4 } from "uuid";
import Prisma from "../db/db.js";

class AuditLogService {
  static async getAuditLogs({
    page = 1,
    limit = 10,
    filters = {},
    userRole = null,
    userId = null,
  } = {}) {
    const isAdmin = userRole === "ADMIN";
    const isEmployee = userRole === "employee";
    const isAdminOrEmployee = isAdmin || isEmployee;

    const where = {};

    // NON ADMIN USERS → ONLY OWN LOGS
    if (!isAdminOrEmployee && userId) {
      where.userId = userId;
    }

    // YEAR FILTER
    if (filters.year) {
      const start = new Date(`${filters.year}-01-01`);
      const end = new Date(`${filters.year}-12-31`);

      where.createdAt = {
        gte: start,
        lte: end,
      };
    }

    // ACTION FILTER
    if (filters.action) {
      where.action = {
        contains: filters.action,
      };
    }

    // DEVICE FILTER
    if (filters.deviceType && filters.deviceType !== "all") {
      where.metadata = {
        path: "$.userAgent.device.type",
        equals: filters.deviceType,
      };
    }

    // SEARCH
    if (filters.search) {
      const search = filters.search;

      // search users first
      const matchedUsers = await Prisma.user.findMany({
        where: {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
            { phoneNumber: { contains: search } },
          ],
        },
        select: { id: true },
      });

      const userIds = matchedUsers.map((u) => u.id);

      where.OR = [
        {
          action: {
            contains: search,
          },
        },
        {
          entityType: {
            contains: search,
          },
        },
        {
          ipAddress: {
            contains: search,
          },
        },
        {
          userId: {
            in: userIds,
          },
        },
      ];
    }

    // ROLE FILTER (ADMIN / EMPLOYEE ONLY)
    if (filters.roleId && isAdminOrEmployee) {
      const usersWithRole = await Prisma.user.findMany({
        where: { roleId: filters.roleId },
        select: { id: true },
      });

      const ids = usersWithRole.map((u) => u.id);

      where.userId = {
        in: ids,
      };
    }

    const currentPage = Math.max(1, parseInt(page));
    const pageSize = Math.max(1, Math.min(parseInt(limit), 100));
    const skip = (currentPage - 1) * pageSize;

    const sortBy = filters.sortBy || "createdAt";
    const sortOrder = filters.sort || "desc";

    const [totalItems, logs, yearlyLogs] = await Promise.all([
      Prisma.auditLog.count({ where }),

      Prisma.auditLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),

      Prisma.auditLog.findMany({
        where,
        select: {
          createdAt: true,
        },
      }),
    ]);

    // FETCH USERS
    const userIds = [...new Set(logs.map((l) => l.userId).filter(Boolean))];

    let users = [];

    if (userIds.length) {
      users = await Prisma.user.findMany({
        where: {
          id: { in: userIds },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phoneNumber: true,
          roleId: true,
          parent: {
            select: {
              email: true,
              phoneNumber: true,
              hierarchyLevel: true,
            },
          },
        },
      });
    }

    // MAP USERS WITH LOGS
    const paginatedLogs = logs.map((log) => {
      const user = users.find((u) => u.id === log.userId);

      return {
        ...log,
        user,
        timestamp: log.createdAt,
        message: {
          action: log.action,
          entityType: log.entityType,
          entityId: log.entityId,
          ipAddress: log.ipAddress,
          metadata: log.metadata,
        },
      };
    });

    // ===== GITHUB HEATMAP =====

    const contributionMap = {};

    yearlyLogs.forEach((log) => {
      const date = log.createdAt.toISOString().split("T")[0];

      if (!contributionMap[date]) {
        contributionMap[date] = 0;
      }

      contributionMap[date]++;
    });

    const contributionGraph = Object.entries(contributionMap).map(
      ([date, count]) => {
        let level = 0;

        if (count >= 1 && count <= 2) level = 1;
        else if (count <= 5) level = 2;
        else if (count <= 10) level = 3;
        else if (count > 10) level = 4;

        return {
          date,
          count,
          level,
        };
      }
    );

    const totalPages = Math.ceil(totalItems / pageSize);

    const pagination = {
      page: currentPage,
      limit: pageSize,
      totalCount: totalItems,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
      showingFrom: totalItems > 0 ? skip + 1 : 0,
      showingTo: totalItems > 0 ? Math.min(skip + pageSize, totalItems) : 0,
      totalItems,
      isAdmin,
      isEmployee,
      isAdminOrEmployee,
    };

    return {
      paginatedLogs,
      pagination,
      contributionGraph,
    };
  }

  static async createAuditLog({
    userId = null,
    action,
    entityType = null,
    entityId = null,
    ipAddress = null,
    metadata = {},
  }) {
    const auditData = {
      id: uuidv4(),
      userId,
      action,
      entityType,
      entityId,
      ipAddress,
      metadata,
    };

    const savedLog = await Prisma.auditLog.create({
      data: auditData,
    });

    return {
      success: true,
      data: savedLog,
      message: "Audit log created successfully",
    };
  }
}

export default AuditLogService;
