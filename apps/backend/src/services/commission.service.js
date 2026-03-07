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
      mode,
      type,
      value,
      applyTDS,
      tdsPercent,
      applyGST,
      gstPercent,
      effectiveTo,
    } = data;

    if (!mode || !type || value === undefined || value === null) {
      throw ApiError.badRequest("mode, type and value are required");
    }

    if (mode === "COMMISSION" && applyTDS && !tdsPercent) {
      throw ApiError.badRequest("TDS percent required");
    }

    if (mode === "SURCHARGE" && applyGST && !gstPercent) {
      throw ApiError.badRequest("GST percent required");
    }

    // Validation based on scope
    if (scope === "ROLE" && !roleId) {
      throw ApiError.badRequest("roleId is required for ROLE scope");
    }
    if (scope === "USER" && !targetUserId) {
      throw ApiError.badRequest("targetUserId is required for USER scope");
    }

    // Verify referenced entities exist
    if (serviceId) {
      const service = await Prisma.serviceProviderMapping.findUnique({
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

    // Check for existing active commission setting
    const existing = await Prisma.commissionSetting.findFirst({
      where: {
        scope,
        roleId: roleId || null,
        targetUserId: targetUserId || null,
        serviceProviderMappingId: serviceId || null,
        isActive: true,
      },
    });

    const payload = {
      scope,
      roleId: roleId || null,
      targetUserId: targetUserId || null,
      serviceProviderMappingId: serviceId || null,

      mode,
      type,
      value: BigInt(value),

      applyTDS: applyTDS || false,
      tdsPercent: tdsPercent ? BigInt(tdsPercent) : null,

      applyGST: applyGST || false,
      gstPercent: gstPercent ? BigInt(gstPercent) : null,

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

    return Helper.serializeBigInt(result);
  }

  static async getCommissionSettingsByRoleOrUser(userId) {
    if (!userId) throw ApiError.unauthorized("User ID is required");

    const user = await Prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true },
    });

    if (!user) throw ApiError.notFound("User not found");

    const settings = await Prisma.commissionSetting.findMany({
      where: {
        isActive: true,
        OR: [{ targetUserId: userId }, { scope: "ROLE", roleId: user.roleId }],
      },
      include: {
        service: {
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
          },
        },
        role: {
          select: { id: true, name: true, level: true },
        },
        targetUser: {
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
    const user = await Prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          select: { type: true, name: true },
        },
      },
    });

    if (!user) throw ApiError.notFound("User not found");

    let filter = {};

    // If employee → only show ADMIN created commissions
    if (user.role?.type === "employee") {
      const admin = await Prisma.user.findFirst({
        where: {
          role: { name: "ADMIN" },
        },
      });

      if (!admin) {
        throw ApiError.notFound("Admin user not found");
      }

      filter.createdBy = admin.id;
    }

    const settings = await Prisma.commissionSetting.findMany({
      where: filter,
      include: {
        serviceProviderMapping: {
          include: {
            service: {
              select: {
                id: true,
                code: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
        role: {
          select: { id: true, name: true, level: true },
        },
        targetUser: {
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

    return Helper.serializeBigInt(settings);
  }

  static async getApplicableRule(tx, userId, serviceProviderMappingId, mode) {
    const currentUser = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, roleId: true },
    });

    if (!currentUser) {
      throw ApiError.notFound("User not found");
    }

    const normalizedMode = mode.toUpperCase();

    // 1️⃣ USER RULE
    let rule = await tx.commissionSetting.findFirst({
      where: {
        serviceProviderMappingId,
        mode: normalizedMode,
        isActive: true,
        targetUserId: currentUser.id,
      },
    });

    if (rule) return rule;

    // 2️⃣ ROLE RULE
    rule = await tx.commissionSetting.findFirst({
      where: {
        serviceProviderMappingId,
        mode: normalizedMode,
        isActive: true,
        roleId: currentUser.roleId,
      },
    });

    if (rule) return rule;

    throw ApiError.badRequest(`Pricing rule not configured for user ${userId}`);
  }
}

export default class CommissionEarningService {
  //  CREATE COMMISSION EARNING
  static async create(
    tx,
    {
      transactionId,
      userId,
      fromUserId = null,
      serviceProviderMappingId,
      amount = 0n,
      mode,
      type,
      commissionAmount = 0n,
      surchargeAmount = null,
      tdsAmount = null,
      gstAmount = null,
      netAmount = 0n,
      metadata = null,
      createdBy,
    }
  ) {
    if (!transactionId || !userId || !serviceProviderMappingId || !createdBy) {
      throw ApiError.badRequest("Required fields missing");
    }

    return await tx.commissionEarning.create({
      data: {
        transaction: {
          connect: { id: transactionId },
        },

        user: {
          connect: { id: userId },
        },

        fromUser: fromUserId ? { connect: { id: fromUserId } } : undefined,

        serviceProviderMapping: {
          connect: { id: serviceProviderMappingId },
        },

        createdByUser: {
          connect: { id: createdBy },
        },

        amount: BigInt(amount ?? 0),

        mode,
        type,

        commissionAmount: BigInt(commissionAmount ?? 0),
        surchargeAmount:
          surchargeAmount !== null ? BigInt(surchargeAmount) : null,
        tdsAmount: BigInt(tdsAmount ?? 0),
        gstAmount: BigInt(gstAmount ?? 0),

        netAmount: BigInt(netAmount ?? 0),

        metadata,
      },
    });
  }

  //  GET BY TRANSACTION
  static async getByTransaction(transactionId) {
    if (!transactionId) throw ApiError.badRequest("TransactionId required");

    return await Prisma.commissionEarning.findMany({
      where: { transactionId },
      include: {
        user: true,
        fromUser: true,
        serviceProviderMapping: true,
        transaction: true,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  //  GET USER EARNINGS
  static async getUserEarnings(userId) {
    if (!userId) throw ApiError.badRequest("UserId required");

    return await Prisma.commissionEarning.findMany({
      where: { userId },
      include: {
        transaction: true,
        serviceProviderMapping: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  //  TOTAL USER EARNING
  static async getTotalUserEarning(userId) {
    if (!userId) throw ApiError.badRequest("UserId required");

    const result = await Prisma.commissionEarning.aggregate({
      where: { userId },
      _sum: { netAmount: true },
    });

    return result._sum.netAmount ?? 0n;
  }

  //  REVERSE COMMISSION (Refund Case)
  static async reverse(
    tx,
    { originalTransactionId, newTransactionId, createdBy }
  ) {
    if (!originalTransactionId || !newTransactionId)
      throw ApiError.badRequest("Transaction IDs required");

    const earnings = await tx.commissionEarning.findMany({
      where: { transactionId: originalTransactionId },
    });

    for (const earning of earnings) {
      await tx.commissionEarning.create({
        data: {
          transactionId: newTransactionId,
          userId: earning.userId,
          fromUserId: earning.fromUserId,
          serviceProviderMappingId: earning.serviceProviderMappingId,

          amount: earning.amount,
          mode: earning.mode,
          type: earning.type,

          commissionAmount: earning.commissionAmount,
          surchargeAmount: earning.surchargeAmount,
          tdsAmount: earning.tdsAmount,
          gstAmount: earning.gstAmount,

          // 🔁 reverse amount
          netAmount: -earning.netAmount,

          metadata: {
            reversedFrom: originalTransactionId,
          },

          createdBy,
        },
      });
    }
  }
}
