import { auditLogger } from "../utils/logger.js";
import { ApiError } from "../utils/ApiError.js";
import fs from "fs";
import readline from "readline";
import path from "path";
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
    try {
      const logFilePath = path.join(process.cwd(), "logs", "auditlogs.log");

      if (!fs.existsSync(logFilePath)) {
        return {
          result: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalCount: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
            showingFrom: 0,
            showingTo: 0,
            totalItems: 0,
          },
        };
      }

      const logs = [];
      const fileStream = fs.createReadStream(logFilePath, { encoding: "utf8" });
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
      });

      for await (const line of rl) {
        if (!line.trim()) continue;
        try {
          const log = JSON.parse(line);
          logs.push(log);
        } catch {
          continue;
        }
      }

      let filteredLogs = logs;

      let userRoleType = null;
      let userRoleName = null;
      if (userId) {
        const user = await Prisma.user.findUnique({
          where: { id: userId },
          include: {
            role: {
              select: {
                type: true,
                name: true,
              },
            },
          },
        });
        userRoleType = user?.role?.type;
        userRoleName = user?.role?.name;
      }

      const isAdmin = userRoleName === "ADMIN";
      const isEmployee = userRoleType === "employee";
      const isAdminOrEmployee = isAdmin || isEmployee;

      if (!isAdminOrEmployee && userId) {
        filteredLogs = filteredLogs.filter((log) => {
          const logUserId =
            log.userId ||
            log.user?.id ||
            log.message?.userId ||
            log.message?.metadata?.userId;
          const match = logUserId && logUserId.toString() === userId.toString();
          return match;
        });
      }

      if (filters) {
        if (filters.action) {
          const action = filters.action.toLowerCase();
          filteredLogs = filteredLogs.filter(
            (log) =>
              log.action?.toLowerCase().includes(action) ||
              log.message?.action?.toLowerCase().includes(action)
          );
        }

        if (filters.resource) {
          const resource = filters.resource.toLowerCase();
          filteredLogs = filteredLogs.filter(
            (log) =>
              log.resource?.toLowerCase().includes(resource) ||
              log.message?.resource?.toLowerCase().includes(resource)
          );
        }

        if (filters.deviceType && filters.deviceType !== "all") {
          const deviceType = filters.deviceType.toLowerCase();
          filteredLogs = filteredLogs.filter((log) => {
            const logDevice =
              log.message?.metadata?.userAgent?.device?.type?.toLowerCase();
            return logDevice === deviceType;
          });
        }

        if (filters.startDate && filters.endDate) {
          const start = new Date(filters.startDate);
          const end = new Date(filters.endDate);
          filteredLogs = filteredLogs.filter((log) => {
            const logDate = new Date(log.timestamp);
            return logDate >= start && logDate <= end;
          });
        }

        if (isAdminOrEmployee && filters.search) {
          const term = filters.search.toLowerCase();
          filteredLogs = filteredLogs.filter((log) => {
            const combined = JSON.stringify(log).toLowerCase();
            return combined.includes(term);
          });
        }
      }

      const sortBy = filters.sortBy || "timestamp";
      const sortOrder = filters.sortOrder || "desc";

      filteredLogs.sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        if (sortBy === "timestamp") {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });

      const currentPage = Math.max(1, parseInt(page));
      const pageSize = Math.max(1, Math.min(parseInt(limit), 100));
      const totalItems = filteredLogs.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      const skip = (currentPage - 1) * pageSize;
      const enrichedLogs = filteredLogs.slice(skip, skip + pageSize);

      const uniqueUserIds = [
        ...new Set(
          enrichedLogs
            .map((log) => log.userId || log.message?.userId)
            .filter(Boolean)
        ),
      ];

      let users = [];
      if (uniqueUserIds.length > 0) {
        const userWhereClause = {
          id: { in: uniqueUserIds },
        };

        if (filters?.roleId) {
          userWhereClause.roleId = filters.roleId;
        }

        users = await Prisma.user.findMany({
          where: userWhereClause,
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

      const paginatedLogs = enrichedLogs
        .map((log) => {
          const logUserId = log.userId || log.message?.userId;
          const user = users.find((u) => u.id === logUserId);

          if (!user) return null;

          return {
            ...log,
            user: {
              id: user.id,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phoneNumber: user.phoneNumber,
              roleId: user.roleId,
              parent: user.parent,
            },
          };
        })
        .filter((log) => log !== null);

      const pagination = {
        page: currentPage,
        limit: pageSize,
        totalCount: totalItems,
        totalPages: totalPages,
        hasNext: currentPage < totalPages,
        hasPrev: currentPage > 1,
        showingFrom: totalItems > 0 ? skip + 1 : 0,
        showingTo: totalItems > 0 ? Math.min(skip + pageSize, totalItems) : 0,
        totalItems: totalItems,
        userRoleType: userRoleType,
        userRoleName: userRoleName,
        isAdmin: isAdmin,
        isEmployee: isEmployee,
        isAdminOrEmployee: isAdminOrEmployee,
      };

      return {
        paginatedLogs,
        pagination,
      };
    } catch (error) {
      throw ApiError.internal(`Failed to fetch audit logs: ${error.message}`);
    }
  }

  static async createAuditLog({
    userId = null,
    action,
    entityType = null,
    entityId = null,
    ipAddress = null,
    metadata = {},
  }) {
    try {
      const auditData = {
        id: uuidv4(),
        userId,
        action,
        entityType,
        entityId,
        ipAddress,
        metadata,
      };

      auditLogger.info(auditData);

      return {
        success: true,
        data: auditData,
        message: "Audit log created successfully",
      };
    } catch (error) {
      throw ApiError.internal("Failed to create audit log");
    }
  }
}

export default AuditLogService;
