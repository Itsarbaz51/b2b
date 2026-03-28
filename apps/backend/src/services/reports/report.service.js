import Prisma from "../../db/db.js";
import { Parser } from "json2csv";

export default class ReportService {
  static async getTransactionReport({ userId, role, filters = {} }) {
    const {
      targetUserId,
      status,
      serviceId,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      search,
      page = 1,
      limit = 20,
    } = filters;

    const isAdmin = ["ADMIN", "EMPLOYEE"].includes(role);

    const where = {
      ...(isAdmin ? targetUserId && { userId: targetUserId } : { userId }),

      ...(status && status !== "ALL" && { status }),

      ...(serviceId && { serviceProviderMappingId: serviceId }),

      ...(fromDate &&
        toDate && {
          initiatedAt: {
            gte: new Date(fromDate),
            lte: new Date(toDate),
          },
        }),

      ...(minAmount || maxAmount
        ? {
            amount: {
              ...(minAmount && { gte: Number(minAmount) }),
              ...(maxAmount && { lte: Number(maxAmount) }),
            },
          }
        : {}),

      ...(search && {
        OR: [
          { txnId: { contains: search } },
          { user: { phoneNumber: { contains: search } } },
        ],
      }),
    };

    const [rows, total] = await Promise.all([
      Prisma.transaction.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { initiatedAt: "desc" },
        include: {
          user: true,
          serviceProviderMapping: {
            include: {
              service: true,
              provider: true,
            },
          },
        },
      }),
      Prisma.transaction.count({ where }),
    ]);

    const data = rows.map((txn) => {
      const pricing = txn.pricing || {};
      const surcharge = Number(pricing.surcharge || 0);
      const providerCost = Number(pricing.providerCost || 0);

      const profit = isAdmin ? surcharge : Number(txn.amount) - providerCost;

      return {
        txnId: txn.txnId,
        user: txn.user?.username,
        phone: txn.user?.phoneNumber,

        service: txn.serviceProviderMapping?.service?.name,
        provider: txn.serviceProviderMapping?.provider?.code,

        amount: Number(txn.amount),
        providerCost,
        surcharge,
        profit,

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

  static async exportCSV({ userId, role, filters = {} }) {
    const report = await this.getTransactionReport({
      userId,
      role,
      filters: { ...filters, page: 1, limit: 100000 },
    });

    const parser = new Parser();
    return parser.parse(report.data);
  }
}
