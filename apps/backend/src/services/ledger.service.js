import Prisma from "../db/db.js";
import Helper from "../utils/helper.js";

export default class LedgerService {
  static async getLedger({
    userId,
    role,
    transactionId: txnId,
    page = 1,
    limit = 20,
    startDate,
    endDate,
    type,
  }) {
    const pageNumber = Number(page) > 0 ? Number(page) : 1;
    const limitNumber = Number(limit) > 0 ? Number(limit) : 20;

    const skip = (pageNumber - 1) * limitNumber;

    // ✅ normalize role
    const normalizedRole = String(role || "").toLowerCase();

    // 🎯 ROLE BASED FILTER
    let userFilter = {};

    if (!["admin", "employee"].includes(normalizedRole)) {
      userFilter = {
        wallet: {
          userId: userId,
        },
      };
    }

    // ✅ TYPE NORMALIZE
    const normalizedType = String(type || "").toUpperCase();

    const typeFilter = ["DEBIT", "CREDIT"].includes(normalizedType)
      ? { entryType: normalizedType }
      : {};

    // 🔥 FINAL WHERE (FIXED)
    const where = {
      ...userFilter,
      ...(txnId && {
        transaction: {
          txnId: txnId, // ✅ correct mapping
        },
      }),
      ...typeFilter,
      ...(startDate &&
        endDate && {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const [entries, total] = await Promise.all([
      Prisma.ledgerEntry.findMany({
        where,
        include: {
          wallet: {
            select: {
              id: true,
              userId: true,
              walletType: true,
              user: {
                select: {
                  username: true,
                  role: {
                    select: {
                      name: true,
                    },
                  },
                  parent: {
                    select: {
                      username: true,
                    },
                  },
                },
              },
            },
          },
          transaction: {
            select: {
              txnId: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNumber,
      }),
      Prisma.ledgerEntry.count({ where }),
    ]);

    return {
      data: Helper.serializeBigInt(entries),
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }
}
