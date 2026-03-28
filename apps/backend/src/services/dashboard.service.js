import Prisma from "../db/db.js";

export default class DashboardService {
  // 🔹 DATE FILTER
  static getDateFilter({ type, from, to }) {
    let startDate;
    let endDate = new Date();

    if (type === "all") {
      return null; // ✅ ALL TIME
    }

    if (type === "today") {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
    } else if (type === "yesterday") {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
    } else if (from && to) {
      startDate = new Date(from);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }

  // 🔹 GROUP TYPE
  static getGroupType(startDate, endDate) {
    const diff = (endDate - startDate) / (1000 * 60 * 60 * 24);

    if (diff <= 1) return "hour";
    if (diff <= 31) return "day";
    return "month";
  }

  static async getDashboard({
    userId,
    role,
    type = "all",
    from,
    to,
    status = "ALL",
  }) {
    const isAdmin = role === "ADMIN";

    // 🔹 DATE FILTER
    const dateFilter = this.getDateFilter({ type, from, to });

    const baseFilter = {
      ...(dateFilter && {
        initiatedAt: {
          gte: dateFilter.startDate,
          lte: dateFilter.endDate,
        },
      }),
      ...(isAdmin ? {} : { userId }),
      ...(status !== "ALL" ? { status } : {}),
    };

    const groupType = dateFilter
      ? this.getGroupType(dateFilter.startDate, dateFilter.endDate)
      : "month";

    // 🔹 TRANSACTION COUNTS
    const [success, failed, pending] = await Promise.all([
      Prisma.transaction.count({
        where: { ...baseFilter, status: "SUCCESS" },
      }),
      Prisma.transaction.count({
        where: { ...baseFilter, status: "FAILED" },
      }),
      Prisma.transaction.count({
        where: { ...baseFilter, status: "PENDING" },
      }),
    ]);

    // 🔹 TOTAL VOLUME
    const txnAgg = await Prisma.transaction.aggregate({
      _sum: { amount: true },
      where: baseFilter,
    });

    // 🔹 PROFIT (DATE FILTERED)
    const earningAgg = await Prisma.commissionEarning.aggregate({
      _sum: { netAmount: true },
      where: {
        ...(isAdmin ? {} : { userId }),
        ...(dateFilter && {
          createdAt: {
            gte: dateFilter.startDate,
            lte: dateFilter.endDate,
          },
        }),
      },
    });

    // 🔹 GST
    const gstAgg = await Prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        referenceType: "USER_GST",
        ...(isAdmin ? {} : { userId }),
      },
    });

    // 🔹 TDS
    const tdsAgg = await Prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        referenceType: "TDS",
        ...(isAdmin ? {} : { userId }),
      },
    });

    // 🔹 WALLET (exclude ADMIN wallets)
    const wallets = await Prisma.wallet.findMany({
      where: isAdmin
        ? {
            user: {
              role: {
                name: {
                  notIn: ["ADMIN"],
                },
              },
            },
          }
        : { userId },
    });

    const sum = (arr) =>
      arr.reduce((s, w) => s + Number(w.balance - w.holdBalance), 0);

    const totalPrimaryBalance = sum(
      wallets.filter((w) => w.walletType === "PRIMARY")
    );

    const totalCommissionBalance = sum(
      wallets.filter((w) => w.walletType === "COMMISSION")
    );

    // 🔹 REVENUE + PROFIT
    const txns = await Prisma.transaction.findMany({
      where: {
        ...baseFilter,
        status: "SUCCESS",
      },
      select: {
        amount: true,
        pricing: true,
        initiatedAt: true,
      },
    });

    let totalRevenue = 0;
    let totalProfit = 0;

    txns.forEach((txn) => {
      const pricing = txn.pricing || {};

      totalRevenue += Number(txn.amount || 0);
      totalProfit += Number(pricing.surcharge || 0);
    });

    // 🔹 SERVICE WISE
    const grouped = await Prisma.transaction.groupBy({
      by: ["serviceProviderMappingId"],
      where: { ...baseFilter, status: "SUCCESS" },
      _sum: { amount: true },
    });

    const mappings = await Prisma.serviceProviderMapping.findMany({
      where: { id: { in: grouped.map((g) => g.serviceProviderMappingId) } },
      include: { service: true, provider: true },
    });

    const services = grouped.map((g) => {
      const map = mappings.find((m) => m.id === g.serviceProviderMappingId);

      return {
        name: map?.service?.name || "Unknown",
        code: map?.service?.code || "UNKNOWN",
        providerName: map?.provider?.name || "Unknown",
        providerCode: map?.provider?.code || "UNKNOWN",
        total: Number(g._sum.amount || 0),
      };
    });

    // 🔹 CHART
    const chartMap = {};

    txns.forEach((txn) => {
      const d = txn.initiatedAt;

      let label =
        groupType === "hour"
          ? `${d.getHours()}:00`
          : groupType === "day"
            ? d.toISOString().slice(0, 10)
            : d.toISOString().slice(0, 7);

      if (!chartMap[label]) chartMap[label] = { label, total: 0 };

      chartMap[label].total += Number(txn.amount);
    });

    const chart = Object.values(chartMap);

    // 🔹 FINAL RESPONSE
    return {
      summary: {
        totalVolume: txnAgg._sum.amount || 0,

        totalProfit: earningAgg._sum.netAmount || 0, // filtered
        totalGST: gstAgg._sum.amount || 0,
        totalTDS: tdsAgg._sum.amount || 0,

        totalPrimaryBalance,
        totalCommissionBalance,

        totalRevenue,
        totalTxnProfit: totalProfit,

        success,
        failed,
        pending,
      },

      services,
      chart,
    };
  }
}
