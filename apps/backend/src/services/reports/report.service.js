import Prisma from "../../db/db.js";

export default class ReportService {
  static async getProfitBreakdown({ userId, fromDate, toDate, role }) {
    const where = {
      createdAt: {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      },
    };

    // 🔥 user specific
    if (role !== "ADMIN") {
      where.userId = userId;
    }

    const data = await Prisma.commissionEarning.findMany({
      where,
      select: {
        userId: true,
        surchargeAmount: true,
        commissionAmount: true,
        netAmount: true,
        createdAt: true,
        transactionId: true,
      },
    });

    // 🔥 aggregation
    const summary = {};

    for (const row of data) {
      if (!summary[row.userId]) {
        summary[row.userId] = {
          totalProfit: 0,
          totalTxn: 0,
        };
      }

      summary[row.userId].totalProfit += Number(row.netAmount);
      summary[row.userId].totalTxn += 1;
    }

    return summary;
  }

  // CA REPORT (GST + PROFIT)
  static async getCAReport({ fromDate, toDate }) {
    const where = {
      createdAt: {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      },
    };

    // 🔹 Total surcharge collected
    const surcharge = await Prisma.commissionEarning.aggregate({
      _sum: { surchargeAmount: true },
      where,
    });

    // 🔹 GST collected from user
    const gstOut = await Prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        referenceType: "USER_GST",
        createdAt: where.createdAt,
      },
    });

    // 🔹 GST paid to provider
    const gstIn = await Prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        referenceType: "PROVIDER_GST",
        createdAt: where.createdAt,
      },
    });

    // 🔹 Total distributor payout
    const payout = await Prisma.commissionEarning.aggregate({
      _sum: { netAmount: true },
      where,
    });

    const totalRevenue = Number(surcharge._sum.surchargeAmount || 0);
    const totalGSTOut = Number(gstOut._sum.amount || 0);
    const totalGSTIn = Number(gstIn._sum.amount || 0);
    const totalPayout = Number(payout._sum.netAmount || 0);

    return {
      revenue: totalRevenue,

      gst: {
        outputGST: totalGSTOut,
        inputGST: totalGSTIn,
        payableGST: totalGSTOut - totalGSTIn,
      },

      payoutToUsers: totalPayout,

      netProfit: totalRevenue - totalPayout - (totalGSTOut - totalGSTIn),
    };
  }
}
