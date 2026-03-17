import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";

export class CommissionSettingService {
  static async createOrUpdateCommissionSetting(data, createdBy) {
    const {
      scope,
      roleId,
      targetUserId,
      serviceProviderMappingId,
      mode,
      type,
      value,
      applyTDS,
      tdsPercent,
      applyGST,
      gstPercent,
      supportsSlab,
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
    if (serviceProviderMappingId) {
      const service = await Prisma.serviceProviderMapping.findUnique({
        where: { id: serviceProviderMappingId },
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
        serviceProviderMappingId: serviceProviderMappingId || null,
        isActive: true,
      },
    });

    const payload = {
      scope,
      role: roleId ? { connect: { id: roleId } } : { disconnect: true },

      targetUser: targetUserId
        ? { connect: { id: targetUserId } }
        : { disconnect: true },

      serviceProviderMapping: {
        connect: { id: serviceProviderMappingId },
      },

      mode,
      type,
      value: BigInt(value),

      applyTDS: applyTDS || false,
      tdsPercent: tdsPercent ? BigInt(tdsPercent) : null,

      applyGST: applyGST || false,
      gstPercent: gstPercent ? BigInt(gstPercent) : null,
      supportsSlab,
      createdBy,
      isActive: true,
    };
    console.log(payload);

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
          select: {
            id: true,
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
        commissionSlabs: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return Helper.serializeBigInt(settings);
  }

  static async checkUserPricingRule(userId, serviceProviderMappingId) {
    if (!userId || !serviceProviderMappingId) {
      throw ApiError.badRequest("userId and serviceProviderMappingId required");
    }

    const user = await Prisma.user.findUnique({
      where: { id: userId },
      select: { roleId: true },
    });

    if (!user) throw ApiError.notFound("User not found");

    let rule = await Prisma.commissionSetting.findFirst({
      where: {
        serviceProviderMappingId,
        isActive: true,
        targetUserId: userId,
      },
    });

    rule = await Prisma.commissionSetting.findFirst({
      where: {
        serviceProviderMappingId,
        isActive: true,
        roleId: user.roleId,
      },
    });

    if (!rule) {
      throw ApiError.badRequest(
        "Pricing rule is not configured for this service. Please contact your administrator."
      );
    }

    return rule;
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

  static async getCommissionEarnings(filters = {}) {
    const {
      userId,
      fromUserId,
      serviceId,
      transactionId,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = filters;

    const where = {};

    if (userId) where.userId = userId;
    if (fromUserId) where.fromUserId = fromUserId;
    if (transactionId) where.transactionId = transactionId;

    if (serviceId) {
      where.serviceProviderMapping = {
        serviceId,
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};

      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    // total count
    const total = await Prisma.commissionEarning.count({ where });

    const earningData = await Prisma.commissionEarning.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        amount: true,
        commissionAmount: true,
        surchargeAmount: true,
        netAmount: true,
        mode: true,
        type: true,
        createdAt: true,

        transaction: {
          select: {
            txnId: true,
            amount: true,
            status: true,
          },
        },

        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
          },
        },

        fromUser: {
          select: {
            id: true,
            username: true,
          },
        },

        serviceProviderMapping: {
          select: {
            service: {
              select: {
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      earnings: Helper.serializeBigInt(earningData),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
      },
    };
  }

  static async getCommissionSummary(userId = null) {
    const where = {};

    if (userId) where.userId = userId;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalCommission, todayCommission, monthCommission, totalTxn] =
      await Promise.all([
        Prisma.commissionEarning.aggregate({
          where,
          _sum: { netAmount: true },
        }),

        Prisma.commissionEarning.aggregate({
          where: {
            ...where,
            createdAt: { gte: startOfToday },
          },
          _sum: { netAmount: true },
        }),

        Prisma.commissionEarning.aggregate({
          where: {
            ...where,
            createdAt: { gte: startOfMonth },
          },
          _sum: { netAmount: true },
        }),

        Prisma.commissionEarning.count({ where }),
      ]);

    const summary = {
      totalCommission: totalCommission._sum.netAmount ?? 0n,
      todayCommission: todayCommission._sum.netAmount ?? 0n,
      monthlyCommission: monthCommission._sum.netAmount ?? 0n,
      totalTransactions: totalTxn,
    };

    return Helper.serializeBigInt(summary);
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

export class CommissionSlabService {
  static async upsert(payload) {
    const { id, commissionSettingId, minAmount, maxAmount, value, _delete } =
      payload;

    // DELETE
    if (_delete === true) {
      if (!id) throw ApiError.badRequest("Slab id required for delete");

      const slab = await Prisma.commissionSlab.findUnique({
        where: { id },
      });

      if (!slab) throw ApiError.notFound("Slab not found");

      return Prisma.commissionSlab.delete({
        where: { id },
      });
    }

    if (!commissionSettingId)
      throw ApiError.badRequest("commissionSettingId required");

    const min = BigInt(minAmount);
    const max = BigInt(maxAmount);

    if (min >= max)
      throw ApiError.badRequest("Min amount must be less than max");

    // overlap check
    const overlap = await Prisma.commissionSlab.findFirst({
      where: {
        commissionSettingId,
        minAmount: { lte: max },
        maxAmount: { gte: min },
        NOT: id ? { id } : undefined,
      },
    });

    if (overlap) throw ApiError.conflict("Slab range overlap");

    // UPDATE
    if (id) {
      const slab = await Prisma.commissionSlab.findUnique({
        where: { id },
      });

      if (!slab) throw ApiError.notFound("Slab not found");

      return Prisma.commissionSlab.update({
        where: { id },
        data: {
          minAmount: min,
          maxAmount: max,
          value: BigInt(value),
        },
      });
    }

    // CREATE
    return Prisma.commissionSlab.create({
      data: {
        commissionSettingId,
        minAmount: min,
        maxAmount: max,
        value: BigInt(value),
      },
    });
  }
}
