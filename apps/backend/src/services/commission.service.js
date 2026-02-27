import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";

export class CommissionSettingService {
  static async createOrUpdateCommissionSetting(data, createdBy) {
    const {
      scope,
      roleId,
      targetUserId,
      serviceId,
      commissionType,
      commissionValue,
      minAmount,
      maxAmount,
      applyTDS,
      tdsPercent,
      applyGST,
      gstPercent,
      applySurcharge,
      surchargeType,
      surchargeAmount,
      effectiveFrom,
      effectiveTo,
    } = data;

    // Validation based on scope
    if (scope === "ROLE" && !roleId) {
      throw ApiError.badRequest("roleId is required for ROLE scope");
    }
    if (scope === "USER" && !targetUserId) {
      throw ApiError.badRequest("targetUserId is required for USER scope");
    }

    // Verify referenced entities exist
    if (serviceId) {
      const service = await Prisma.serviceProvider.findUnique({
        where: { id: serviceId },
      });
      if (!service) throw ApiError.notFound("Service not found");
    }

    if (roleId) {
      const roleExists = await Prisma.role.findUnique({
        where: { id: roleId },
      });
      if (!roleExists) throw ApiError.notFound("Role not found");
    }

    if (targetUserId) {
      const userExists = await Prisma.user.findUnique({
        where: { id: targetUserId },
      });
      if (!userExists) throw ApiError.notFound("Target user not found");
    }

    if (applySurcharge && !surchargeAmount) {
      throw ApiError.badRequest(
        "surchargeAmount is required when applySurcharge is true"
      );
    }
    if (applySurcharge && !surchargeType) {
      throw ApiError.badRequest(
        "surchargeType is required when applySurcharge is true"
      );
    }

    // Check for existing active commission setting
    const existing = await Prisma.commissionSetting.findFirst({
      where: {
        scope,
        roleId: roleId || null,
        targetUserId: targetUserId || null,
        serviceId: serviceId || null,
        isActive: true,
      },
    });

    const payload = {
      scope,
      roleId: roleId || null,
      targetUserId: targetUserId || null,
      serviceId: serviceId || null,
      commissionType,
      commissionValue: commissionValue.toString(),
      minAmount: minAmount ? BigInt(minAmount) : null,
      maxAmount: maxAmount ? BigInt(maxAmount) : null,
      applyTDS: applyTDS || false,
      tdsPercent: tdsPercent ? tdsPercent.toString() : null,
      applyGST: applyGST || false,
      gstPercent: gstPercent ? gstPercent.toString() : null,
      applySurcharge: applySurcharge || false,
      surchargeType: applySurcharge ? surchargeType : null,
      surchargeAmount:
        applySurcharge && surchargeAmount ? surchargeAmount.toString() : null,
      effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : new Date(),
      effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
      createdBy,
      isActive: true,
    };

    let result;
    if (existing) {
      result = await Prisma.commissionSetting.update({
        where: { id: existing.id },
        data: payload,
      });
    } else {
      result = await Prisma.commissionSetting.create({ data: payload });
    }

    return Helper.serializeCommission(result);
  }

  static async getCommissionSettingsByRoleOrUser(userId) {
    if (!userId) throw ApiError.unauthorized("User ID is required");

    const user = await Prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true, hierarchyPath: true },
    });

    if (!user) throw ApiError.notFound("User not found");

    const settings = await Prisma.commissionSetting.findMany({
      where: {
        OR: [{ targetUserId: userId }, { scope: "ROLE", roleId: user.roleId }],
        isActive: true,
      },
      include: {
        service: {
          select: { id: true, code: true, name: true, isActive: true },
        },
        role: { select: { id: true, name: true, level: true } },
        targetUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return Helper.serializeCommission(settings);
  }

  static async getCommissionSettingsAll(userId) {
    // Get user with role information
    const userWithRole = await Prisma.user.findUnique({
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

    if (!userWithRole) {
      throw ApiError.notFound("User not found");
    }

    const userRoleType = userWithRole.role.type;
    let targetUserId = userId;

    // If user is employee, use admin's ID
    if (userRoleType === "employee") {
      const adminUser = await Prisma.user.findFirst({
        where: {
          role: {
            name: "ADMIN",
          },
        },
      });

      if (!adminUser) {
        throw new Error("Admin user not found");
      }

      targetUserId = adminUser.id;
    }

    const settings = await Prisma.commissionSetting.findMany({
      where: {},
      include: {
        service: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
        role: { select: { id: true, name: true, level: true } },
        targetUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Helper.serializeCommission(settings);
  }
}

export class CommissionEarningService {
  static async createCommissionEarning(data) {
    const {
      userId,
      fromUserId,
      serviceId,
      transactionId,
      amount,
      commissionAmount,
      commissionType,
      tdsAmount = 0,
      gstAmount = 0,
      surchargeAmount = 0,
      netAmount,
      metadata,
      createdBy,
    } = data;

    // Validate required references
    const [user, transaction, createdByUser] = await Promise.all([
      Prisma.user.findUnique({ where: { id: userId } }),
      Prisma.transaction.findUnique({ where: { id: transactionId } }),
      Prisma.user.findUnique({ where: { id: createdBy } }),
    ]);

    if (!user) throw ApiError.notFound("User not found");
    if (!transaction) throw ApiError.notFound("Transaction not found");
    if (!createdByUser) throw ApiError.notFound("Created by user not found");

    // Validate optional references
    if (fromUserId) {
      const fromUser = await Prisma.user.findUnique({
        where: { id: fromUserId },
      });
      if (!fromUser) throw ApiError.notFound("From user not found");
    }

    if (serviceId) {
      const service = await Prisma.serviceProvider.findUnique({
        where: { id: serviceId },
      });
      if (!service) throw ApiError.notFound("Service not found");
    }

    const earning = await Prisma.commissionEarning.create({
      data: {
        userId,
        fromUserId: fromUserId || null,
        serviceId: serviceId || null,
        transactionId,
        amount: BigInt(amount),
        commissionAmount: BigInt(commissionAmount),
        commissionType,
        tdsAmount: BigInt(tdsAmount),
        gstAmount: BigInt(gstAmount),
        surchargeAmount: BigInt(surchargeAmount),
        netAmount: BigInt(netAmount),
        metadata: metadata || null,
        createdBy,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        fromUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        transaction: {
          select: {
            id: true,
            referenceId: true,
            amount: true,
            status: true,
            initiatedAt: true,
          },
        },
      },
    });

    return Helper.serializeCommission(earning);
  }

  static async getCommissionEarnings(filters) {
    const { userId, fromUserId, serviceId, transactionId, startDate, endDate } =
      filters;

    const whereClause = {
      ...(userId ? { userId } : {}),
      ...(fromUserId ? { fromUserId } : {}),
      ...(serviceId ? { serviceId } : {}),
      ...(transactionId ? { transactionId } : {}),
    };

    // Date range filter - use initiatedAt for Transaction or createdAt for CommissionEarning
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const earnings = await Prisma.commissionEarning.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        fromUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            username: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        transaction: {
          select: {
            id: true,
            referenceId: true,
            amount: true,
            status: true,
            paymentType: true,
            initiatedAt: true, // Use initiatedAt instead of createdAt
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return Helper.serializeCommission(earnings);
  }

  static async getCommissionSummary(userId, period) {
    const whereClause = { userId };

    // Apply date range if provided
    if (period && period.startDate && period.endDate) {
      whereClause.createdAt = {
        gte: new Date(period.startDate),
        lte: new Date(period.endDate),
      };
    }

    const earnings = await Prisma.commissionEarning.findMany({
      where: whereClause,
      select: {
        commissionAmount: true,
        tdsAmount: true,
        gstAmount: true,
        surchargeAmount: true,
        netAmount: true,
        commissionType: true,
        createdAt: true,
        service: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Calculate totals
    const totalCommission = earnings.reduce(
      (sum, e) => sum + Number(e.commissionAmount),
      0
    );
    const totalTDS = earnings.reduce(
      (sum, e) => sum + Number(e.tdsAmount || 0),
      0
    );
    const totalGST = earnings.reduce(
      (sum, e) => sum + Number(e.gstAmount || 0),
      0
    );
    const totalSurcharge = earnings.reduce(
      (sum, e) => sum + Number(e.surchargeAmount || 0),
      0
    );
    const totalNet = earnings.reduce((sum, e) => sum + Number(e.netAmount), 0);

    // Group by service
    const earningsByService = earnings.reduce((acc, e) => {
      const serviceName = e.service?.name || "Unknown";
      if (!acc[serviceName]) {
        acc[serviceName] = {
          totalCommission: 0,
          totalNet: 0,
          count: 0,
        };
      }
      acc[serviceName].totalCommission += Number(e.commissionAmount);
      acc[serviceName].totalNet += Number(e.netAmount);
      acc[serviceName].count += 1;
      return acc;
    }, {});

    const summary = {
      totalCommission,
      totalTDS,
      totalGST,
      totalNet,
      totalSurcharge,
      transactionCount: earnings.length,
      earningsByService,
    };

    return summary;
  }
}
