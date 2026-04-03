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
    let userFilter = {
      wallet: {
        userId: userId,
      },
    };

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
          createdByUser: {
            select: {
              id: true,
              username: true,
              role: {
                select: {
                  name: true,
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

    if (["admin", "employee"].includes(normalizedRole)) {
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

    const processedEntries = [];
    const map = new Map();

    for (const entry of entries) {
      const txnId = entry.transaction?.txnId || entry.id;

      if (!map.has(txnId)) {
        map.set(txnId, {
          base: entry,
          surchargeTotal: 0,
          gstTotal: 0,
        });
      }

      const item = map.get(txnId);

      // 🔥 SURCHARGE + PROVIDER_COST
      if (
        entry.referenceType === "SURCHARGE" ||
        entry.referenceType === "PROVIDER_COST"
      ) {
        item.surchargeTotal += Number(entry.amount);
      }

      // 🔥 GST combine
      else if (
        entry.referenceType === "SURCHARGE_GST" ||
        entry.referenceType === "PROVIDER_GST"
      ) {
        item.gstTotal += Number(entry.amount);
      }

      // 🔥 Other entries (FUND, PAYOUT etc.)
      else {
        processedEntries.push(entry);
      }
    }

    for (const [txnId, item] of map.entries()) {
      const base = item.base;

      // 👉 SURCHARGE
      if (item.surchargeTotal !== 0) {
        processedEntries.push({
          ...base,
          id: `${txnId}_SURCHARGE`,
          referenceType: "SURCHARGE",
          amount: item.surchargeTotal,
        });
      }

      // 👉 GST
      if (item.gstTotal !== 0) {
        processedEntries.push({
          ...base,
          id: `${txnId}_GST`,
          referenceType: "GST",
          amount: item.gstTotal,
        });
      }
    }
    processedEntries.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return {
      data: Helper.serializeBigInt(processedEntries),
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }
}
