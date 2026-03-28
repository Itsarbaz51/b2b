import Prisma from "../db/db.js";

export default class DashboardService {
  static async getDashboard({ userId, role, range = "7d", status = "ALL" }) {
    const now = new Date();

    let startDate;
    let groupType;

    switch (range) {
      case "1d":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        groupType = "hour";
        break;
      case "7d":
        startDate = new Date(Date.now() - 7 * 86400000);
        groupType = "day";
        break;
      case "1m":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        groupType = "day";
        break;
      case "1y":
        startDate = new Date(now.getFullYear(), 0, 1);
        groupType = "month";
        break;
      default:
        startDate = new Date(0);
        groupType = "month";
    }

    const isAdminOrEmployee = role === "ADMIN" || role === "employee";

    const baseFilter = {
      initiatedAt: { gte: startDate },
      ...(isAdminOrEmployee ? {} : { userId }),
      ...(status !== "ALL" ? { status } : {}),
    };

    // 🔥 COUNTS
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

    // 🔥 SERVICE TOTAL
    const grouped = await Prisma.transaction.groupBy({
      by: ["serviceProviderMappingId"],
      where: { ...baseFilter, status: "SUCCESS" },
      _sum: { amount: true },
    });

    const mappings = await Prisma.serviceProviderMapping.findMany({
      where: { id: { in: grouped.map((g) => g.serviceProviderMappingId) } },
      include: { service: true, provider: true }, // 🔥 provider added
    });

    const services = grouped.map((g) => {
      const map = mappings.find((m) => m.id === g.serviceProviderMappingId);
      return {
        name: map?.service?.name || "Unknown",
        code: map?.service?.code || "UNKNOWN",
        provider: map?.provider?.code || "UNKNOWN", // 🔥 new
        total: Number(g._sum.amount || 0),
      };
    });

    // 🔥 CHART
    const txns = await Prisma.transaction.findMany({
      where: baseFilter,
      select: {
        amount: true,
        initiatedAt: true,
        serviceProviderMappingId: true,
      },
    });

    const mappingMap = {};
    mappings.forEach((m) => {
      mappingMap[m.id] = m.service?.code || "UNKNOWN";
    });

    const chartMap = {};

    txns.forEach((txn) => {
      const date = txn.initiatedAt;

      let label =
        groupType === "hour"
          ? `${date.getHours()}:00`
          : groupType === "day"
            ? date.toISOString().slice(0, 10)
            : date.toISOString().slice(0, 7);

      if (!chartMap[label]) chartMap[label] = { label, total: 0 };

      const code = mappingMap[txn.serviceProviderMappingId] || "UNKNOWN";

      chartMap[label].total += Number(txn.amount);
      chartMap[label][code] = (chartMap[label][code] || 0) + Number(txn.amount);
    });

    const chart = Object.values(chartMap);

    // 🔥 WALLET TOTAL
    const walletFilter = {
      ...(isAdminOrEmployee
        ? {
            user: {
              role: {
                name: {
                  notIn: ["ADMIN", "EMPLOYEE"],
                },
              },
            },
          }
        : { userId }),
    };

    const wallets = await Prisma.wallet.findMany({
      where: walletFilter,
    });

    const sum = (arr) =>
      arr.reduce((s, w) => s + Number(w.balance - w.holdBalance), 0);

    const totalPrimaryBalance = sum(
      wallets.filter((w) => w.walletType === "PRIMARY")
    );

    const totalCommissionBalance = sum(
      wallets.filter((w) => w.walletType === "COMMISSION")
    );

    // 🔥 GST + TDS (ADMIN ONLY)
    let totalGSTBalance = 0;
    let totalTDSBalance = 0;

    if (isAdminOrEmployee) {
      const [gst, tds] = await Promise.all([
        Prisma.wallet.findMany({ where: { walletType: "GST" } }),
        Prisma.wallet.findMany({ where: { walletType: "TDS" } }),
      ]);

      totalGSTBalance = sum(gst);
      totalTDSBalance = sum(tds);
    }

    // 🔥 TODAY (JSON PRICING BASED)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTxns = await Prisma.transaction.findMany({
      where: {
        initiatedAt: { gte: today },
        ...(isAdminOrEmployee ? {} : { userId }),
        status: "SUCCESS",
      },
      select: {
        amount: true,
        pricing: true, // 🔥 key fix
      },
    });

    let todayTotalEarning = 0;
    let todayTotalExpenses = 0;
    let todaySurchargeGiven = 0;
    let todaySurchargeEarned = 0;

    todayTxns.forEach((txn) => {
      const pricing = txn.pricing || {};

      const surcharge = Number(pricing.surcharge || 0);
      const providerCost = Number(pricing.providerCost || 0);

      if (isAdminOrEmployee) {
        // ADMIN
        todayTotalEarning += providerCost;
        todaySurchargeEarned += surcharge;
      } else {
        // USER
        todayTotalEarning += Number(txn.amount || 0);
        todayTotalExpenses += providerCost;
        todaySurchargeGiven += surcharge;
      }
    });

    return {
      summary: {
        totalPrimaryBalance,
        totalCommissionBalance,

        todayTotalEarning,
        todayTotalExpenses,
        todaySurchargeGiven,
        todaySurchargeEarned,

        success,
        failed,
        pending,

        ...(isAdminOrEmployee && {
          totalGSTBalance,
          totalTDSBalance,
        }),
      },

      services,
      chart,
    };
  }
  // static async getDashboard({ userId, role }) {
  //   const where = role === "ADMIN" ? {} : { userId };

  //   const [txn, earnings, gst] = await Promise.all([
  //     Prisma.transaction.aggregate({
  //       _sum: { amount: true },
  //       where,
  //     }),

  //     Prisma.commissionEarning.aggregate({
  //       _sum: { netAmount: true },
  //       where,
  //     }),

  //     Prisma.ledgerEntry.aggregate({
  //       _sum: { amount: true },
  //       where: {
  //         referenceType: "USER_GST",
  //       },
  //     }),
  //   ]);

  //   return {
  //     totalVolume: txn._sum.amount || 0,
  //     totalProfit: earnings._sum.netAmount || 0,
  //     totalGST: gst._sum.amount || 0,
  //   };
  // }
}
