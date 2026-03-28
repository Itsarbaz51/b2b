import Prisma from "../../db/db.js";

export default class CommissionReportService {
  static async getCommissionReport({ userId, role, filters = {} }) {
    const { fromDate, toDate, page = 1, limit = 20 } = filters;

    const isAdmin = ["ADMIN", "EMPLOYEE"].includes(role);

    const where = {
      ...(isAdmin ? {} : { userId }),
      status: "SUCCESS",
      ...(fromDate &&
        toDate && {
          initiatedAt: {
            gte: new Date(fromDate),
            lte: new Date(toDate),
          },
        }),
    };

    const [rows, total] = await Promise.all([
      Prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            include: {
              parent: true,
            },
          },
        },
      }),
      Prisma.transaction.count({ where }),
    ]);

    const data = rows.map((txn) => {
      const pricing = txn.pricing || {};

      return {
        txnId: txn.txnId,
        user: txn.user?.username,
        parent: txn.user?.parent?.username,

        amount: Number(txn.amount),
        commission: Number(pricing.commission || 0),
        surcharge: Number(pricing.surcharge || 0),

        date: txn.initiatedAt,
      };
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
