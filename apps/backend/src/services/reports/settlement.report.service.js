import Prisma from "../../db/db.js";

export default class SettlementReportService {
  static async getSettlementReport({ userId, role, filters = {} }) {
    const { fromDate, toDate, status, page = 1, limit = 20 } = filters;

    const isAdmin = ["ADMIN", "EMPLOYEE"].includes(role);

    const where = {
      ...(isAdmin ? {} : { userId }),
      ...(status && status !== "ALL" && { status }),
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
          user: true,
          serviceProviderMapping: {
            include: { service: true, provider: true },
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

        service: txn.serviceProviderMapping?.service?.name,
        provider: txn.serviceProviderMapping?.provider?.code,

        amount: Number(txn.amount),
        payableToProvider: Number(pricing.providerCost || 0),
        platformFee: Number(pricing.surcharge || 0),

        status: txn.status,
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
