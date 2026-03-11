import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import ApiEntityService from "./apiEntity.service.js";

export default class TransactionService {
  // CREATE
  static async create(
    tx,
    {
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
    if (!userId || !walletId || !serviceProviderMappingId)
      throw ApiError.badRequest("Required fields missing");

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

    const txnId = `TXN-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;

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
    { transactionId, status, netAmount, providerReference, providerResponse }
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
          providerFinalData: providerResponse,
          completedAt: status === "VALID" ? new Date() : undefined,
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
  }) {
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 10;

    const skip = (pageNumber - 1) * limitNumber;

    const where = {};

    /* STATUS FILTER */

    if (status) {
      where.status = status.toUpperCase();
    }

    /* SERVICE TYPE FILTER */

    if (type && type !== "ALL") {
      where.serviceProviderMapping = {
        serviceProvider: {
          code: type,
        },
      };
    }

    /* SEARCH FILTER */

    if (search) {
      where.OR = [
        {
          txnId: {
            contains: search,
          },
        },
        {
          user: {
            name: {
              contains: search,
            },
          },
        },
      ];
    }

    /* DATE FILTER */

    if (date === "today") {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      where.initiatedAt = {
        gte: start,
      };
    }

    const [transactions, total] = await Promise.all([
      Prisma.transaction.findMany({
        where,

        skip,

        take: limitNumber,

        orderBy: {
          initiatedAt: "desc",
        },

        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
            },
          },

          serviceProviderMapping: {
            include: {
              provider: true,
            },
          },
        },
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
