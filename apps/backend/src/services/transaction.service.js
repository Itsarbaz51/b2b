import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import ApiEntityService from "./apiEntity.service.js";

export default class TransactionService {
  // CREATE
  static async create(
    tx,
    {
      txnId,
      userId,
      walletId,
      serviceProviderMappingId,
      amount,
      idempotencyKey,
      providerReference = null,
      requestPayload,
      pricing,
    }
  ) {
    if (!userId || !walletId)
      throw ApiError.badRequest("userId & walletId required");

    // Idempotency Check
    if (idempotencyKey) {
      const existingTxn = await tx.transaction.findUnique({
        where: { idempotencyKey },
        include: { apiEntity: true },
      });

      if (existingTxn) {
        return {
          transaction: existingTxn,
          apiEntity: existingTxn.apiEntity,
        };
      }
    }

    const apiEntity = await ApiEntityService.create(tx, {
      userId,
      serviceProviderMappingId,
      requestPayload,
    });

    const transaction = await tx.transaction.create({
      data: {
        txnId,
        userId,
        walletId,
        providerReference,
        serviceProviderMappingId,
        apiEntityId: apiEntity.id,
        amount,
        pricing,
        netAmount: amount,
        status: "PENDING",
        idempotencyKey,
      },
    });

    return { transaction, apiEntity };
  }

  // UPDATE (Provider response / Final status)
  static async update(
    tx,
    {
      transactionId,
      status,
      netAmount,
      providerReference,
      providerResponse,
      providerInitData,
      retryCount,
      lastCheckedAt,
    }
  ) {
    if (!transactionId) throw ApiError.badRequest("TransactionId required");

    const existingTxn = await tx.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existingTxn) throw ApiError.notFound("Transaction not found");

    if (existingTxn.status === "SUCCESS")
      throw ApiError.badRequest("Transaction already completed");

    // 1️⃣ Update Transaction
    const updatedTxn = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: status ?? existingTxn.status,
        netAmount: netAmount ?? existingTxn.netAmount,
        providerReference,
        providerResponse,
        retryCount,
        lastCheckedAt,
        processedAt: status ? new Date() : undefined,
        completedAt: status === "SUCCESS" ? new Date() : undefined,
      },
    });

    // 2️⃣ Update ApiEntity accordingly
    if (status) {
      await tx.apiEntity.update({
        where: { id: existingTxn.apiEntityId },
        data: {
          status,
          providerInitData,
          providerFinalData: providerResponse,
          completedAt: status === "SUCCESS" ? new Date() : undefined,
          errorData: status === "FAILED" ? providerResponse : undefined,
        },
      });
    }

    return updatedTxn;
  }

  static async checkDuplicate(idempotencyKey) {
    if (!idempotencyKey) return;

    const existingTxn = await Prisma.transaction.findUnique({
      where: { idempotencyKey },
    });

    if (existingTxn) {
      throw ApiError.conflict(
        "Duplicate transaction detected. Please wait for the previous request."
      );
    }
  }

  // get all by types
  static async getTransactions({
    page = 1,
    limit = 10,
    status,
    type,
    search,
    date,
    role,
    userId,
  }) {
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;
    const skip = (pageNumber - 1) * limitNumber;

    const isAdminOrEmployee = role === "ADMIN" || role === "employee";

    const filters = [];

    /* OWN DATA FOR BUSINESS USER */
    if (!isAdminOrEmployee) {
      filters.push({
        userId: userId,
      });
    }

    const selectFields = {
      id: true,
      txnId: true,
      amount: true,
      netAmount: true,
      status: true,
      initiatedAt: true,
      processedAt: true,
      completedAt: true,
      providerReference: true,

      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
        },
      },

      serviceProviderMapping: {
        select: {
          service: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          provider: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    };

    /* EXTRA FIELDS ONLY FOR ADMIN / EMPLOYEE */
    if (isAdminOrEmployee) {
      selectFields.idempotencyKey = true;
      selectFields.pricing = true;
      selectFields.apiEntityId = true;
    }

    /* STATUS FILTER */
    if (status) {
      filters.push({
        status: status.toUpperCase(),
      });
    }

    /* SERVICE TYPE FILTER */
    if (type && type !== "ALL") {
      filters.push({
        serviceProviderMapping: {
          is: {
            service: {
              code: type.toUpperCase(),
            },
          },
        },
      });
    }

    /* SEARCH FILTER */
    if (search) {
      filters.push({
        OR: [
          { txnId: { contains: search } },
          {
            user: {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { phoneNumber: { contains: search } },
              ],
            },
          },
        ],
      });
    }

    /* DATE FILTER */
    if (date && date !== "all") {
      const now = new Date();
      let start;
      let end;

      if (date === "today") {
        start = new Date();
        start.setHours(0, 0, 0, 0);

        end = new Date();
        end.setHours(23, 59, 59, 999);
      }

      if (date === "yesterday") {
        start = new Date();
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);

        end = new Date();
        end.setDate(end.getDate() - 1);
        end.setHours(23, 59, 59, 999);
      }

      if (date === "week") {
        start = new Date();
        start.setDate(now.getDate() - now.getDay());
        start.setHours(0, 0, 0, 0);

        end = new Date();
        end.setHours(23, 59, 59, 999);
      }

      if (date === "month") {
        start = new Date(now.getFullYear(), now.getMonth(), 1);

        end = new Date();
        end.setHours(23, 59, 59, 999);
      }

      if (start && end) {
        filters.push({
          initiatedAt: {
            gte: start,
            lte: end,
          },
        });
      }
    }

    const where = filters.length ? { AND: filters } : {};

    const [transactions, total] = await Promise.all([
      Prisma.transaction.findMany({
        where,
        skip,
        take: limitNumber,
        orderBy: { initiatedAt: "desc" },
        select: selectFields,
      }),

      Prisma.transaction.count({ where }),
    ]);

    return {
      data: Helper.serializeBigInt(transactions),

      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  // dashboard
  static async getSummary() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [pending, successToday, totalVolume, totalCommission] =
      await Promise.all([
        Prisma.transaction.count({
          where: { status: "PENDING" },
        }),

        Prisma.transaction.count({
          where: {
            status: "SUCCESS",
            completedAt: {
              gte: startOfToday,
            },
          },
        }),

        Prisma.transaction.aggregate({
          _sum: { amount: true },
        }),

        Prisma.transaction.aggregate({
          _sum: {
            "pricing.userCommission": true,
          },
        }),
      ]);

    return {
      pending,
      successToday,
      totalVolume: totalVolume._sum.amount || 0,
      totalCommission: totalCommission._sum.userCommission || 0,
    };
  }
}
