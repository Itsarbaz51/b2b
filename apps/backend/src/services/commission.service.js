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
      minAmount,
      maxAmount,
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
      const service = await Prisma.service.findUnique({
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
        serviceId: serviceId || null,
        isActive: true,
      },
    });

    const payload = {
      scope,
      roleId: roleId || null,
      targetUserId: targetUserId || null,
      serviceId: serviceId || null,

      mode,
      type,
      value: value.toString(),

      minAmount: minAmount ? BigInt(minAmount) : null,
      maxAmount: maxAmount ? BigInt(maxAmount) : null,

      applyTDS: applyTDS || false,
      tdsPercent: tdsPercent ? tdsPercent.toString() : null,

      applyGST: applyGST || false,
      gstPercent: gstPercent ? gstPercent.toString() : null,

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
      orderBy: { createdAt: "desc" },
    });

    return Helper.serializeCommission(settings);
  }

  static async resolveRule({ userId, roleId, serviceId }) {
    try {
      const now = new Date();

      // 1️⃣ USER LEVEL CHECK
      const userRule = await Prisma.commissionSetting.findFirst({
        where: {
          scope: "USER",
          targetUserId: userId,
          serviceId,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (userRule) {
        console.log("User Rule Found");
        return userRule;
      }

      // 2️⃣ ROLE LEVEL CHECK
      const roleRule = await Prisma.commissionSetting.findFirst({
        where: {
          scope: "ROLE",
          roleId,
          serviceId,
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
      });

      if (roleRule) {
        console.log("Role Rule Found");
        return roleRule;
      }

      throw ApiError.notFound("Commission rule not configured");
    } catch (err) {
      console.log(err);
      throw err;
    }
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
      amount,
      mode,
      type,
      commissionAmount = 0n,
      surchargeAmount = 0n,
      tdsAmount = null,
      gstAmount = null,
      netAmount,
      metadata = null,
      createdBy,
    }
  ) {
    if (!transactionId || !userId || !serviceProviderMappingId || !createdBy) {
      throw ApiError.badRequest("Required fields missing");
    }

    return await tx.commissionEarning.create({
      data: {
        transactionId,
        userId,
        fromUserId,
        serviceProviderMappingId,

        amount: BigInt(amount),

        mode,
        type,

        commissionAmount: BigInt(commissionAmount),
        surchargeAmount: surchargeAmount ? BigInt(surchargeAmount) : null,
        tdsAmount: tdsAmount ? BigInt(tdsAmount) : null,
        gstAmount: gstAmount ? BigInt(gstAmount) : null,

        netAmount: BigInt(netAmount),

        metadata,
        createdBy,
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
