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

    // 🔥 TOTAL VOLUME
    const totalVolume = await Prisma.transaction.aggregate({
      where: { ...baseFilter, status: "SUCCESS" },
      _sum: { amount: true },
    });

    // 🔥 SERVICE TOTAL
    const grouped = await Prisma.transaction.groupBy({
      by: ["serviceProviderMappingId"],
      where: { ...baseFilter, status: "SUCCESS" },
      _sum: { amount: true },
    });

    const mappings = await Prisma.serviceProviderMapping.findMany({
      where: { id: { in: grouped.map((g) => g.serviceProviderMappingId) } },
      include: { service: true },
    });

    const services = grouped.map((g) => {
      const map = mappings.find((m) => m.id === g.serviceProviderMappingId);
      return {
        name: map?.service?.name || "Unknown",
        code: map?.service?.code || "UNKNOWN",
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
    const walletFilter = isAdminOrEmployee ? {} : { userId };

    const [primary, commission] = await Promise.all([
      Prisma.wallet.findMany({
        where: { walletType: "PRIMARY", ...walletFilter },
      }),
      Prisma.wallet.findMany({
        where: { walletType: "COMMISSION", ...walletFilter },
      }),
    ]);

    const sum = (arr) =>
      arr.reduce((s, w) => s + Number(w.balance - w.holdBalance), 0);

    const totalPrimaryBalance = sum(primary);
    const totalCommissionBalance = sum(commission);

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

    // 🔥 TODAY
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayFilter = {
      initiatedAt: { gte: today },
      ...(isAdminOrEmployee ? {} : { userId }),
    };

    const todayAgg = await Prisma.transaction.aggregate({
      where: { ...todayFilter, status: "SUCCESS" },
      _sum: { amount: true, netAmount: true },
    });

    return {
      summary: {
        totalPrimaryBalance,
        totalCommissionBalance,

        todayTotalEarning: Number(todayAgg._sum.amount || 0),
        todayTotalExpenses: Number(todayAgg._sum.netAmount || 0),

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
}
