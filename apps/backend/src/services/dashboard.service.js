import Prisma from "../db/db.js";

const formatDate = (date) => {
  const d = new Date(date);

  return d
    .toISOString() // 2026-04-11T14:23:45.000Z
    .replace("T", " ") // 2026-04-11 14:23:45.000Z
    .slice(0, 19); // 2026-04-11 14:23:45
};

export default class DashboardService {
  // DATE FILTER
  static getDateFilter({ type, from, to }) {
    let startDate;
    let endDate = new Date();

    if (type === "all") return null;

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

  // GROUP TYPE
  static getGroupType(startDate, endDate) {
    const diff = (endDate - startDate) / (1000 * 60 * 60 * 24);

    if (diff <= 1) return "hour";
    if (diff <= 31) return "day";
    return "month";
  }

  static async getDashboard({
    userId,
    role,
    type = "today",
    from,
    to,
    status = "ALL",
  }) {
    const isAdmin = role;

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

    // COUNTS
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

    // ROLE WISE USERS
    const roles = await Prisma.role.findMany();

    // roleId → name map (fast lookup)
    const roleIdToName = {};
    roles.forEach((r) => {
      roleIdToName[r.id] = r.name;
    });

    // OWN USERS (sab ke liye same - admin bhi)
    const ownUsers = await Prisma.user.findMany({
      where: {
        parentId: userId,
      },
      select: { id: true, roleId: true },
    });

    // ROLE COUNT (ONLY OWN USERS )
    const roleCounts = {
      stateHead: 0,
      masterDistributor: 0,
      distributor: 0,
      retailer: 0,
    };

    ownUsers.forEach((u) => {
      const roleName = roleIdToName[u.roleId];

      if (roleName === "STATE HEAD") roleCounts.stateHead++;
      if (roleName === "MASTER DISTRIBUTOR") roleCounts.masterDistributor++;
      if (roleName === "DISTRIBUTOR") roleCounts.distributor++;
      if (roleName === "RETAILER") roleCounts.retailer++;
    });

    // TOTAL USERS (only admin)
    const totalUsers = isAdmin ? await Prisma.user.count() : null;

    // PROFIT
    const earningAgg = await Prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: {
        entryType: "CREDIT",
        referenceType: { in: ["SURCHARGE", "COMMISSION"] },
        wallet: { userId },
      },
    });

    // GST
    const gstAgg = await Prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { referenceType: "SURCHARGE_GST" },
    });

    // TDS
    const tdsAgg = await Prisma.ledgerEntry.aggregate({
      _sum: { amount: true },
      where: { referenceType: "COMMISSION_TDS" },
    });

    // WALLETS
    const wallets = await Prisma.wallet.findMany({
      where: isAdmin ? {} : { userId },
    });

    const sum = (arr) =>
      arr.reduce((s, w) => s + Number(w.balance - w.holdBalance), 0);

    const totalPrimaryBalance = sum(
      wallets.filter((w) => w.walletType === "PRIMARY")
    );

    const totalCommissionBalance = sum(
      wallets.filter((w) => w.walletType === "COMMISSION")
    );

    // TRANSACTIONS WITH SERVICE
    const txns = await Prisma.transaction.findMany({
      where: {
        ...baseFilter,
        status: "SUCCESS",
      },
      select: {
        amount: true,
        initiatedAt: true,
        serviceProviderMappingId: true,
      },
    });

    // SERVICE MAPPINGS
    const mappingIds = [
      ...new Set(txns.map((t) => t.serviceProviderMappingId).filter(Boolean)),
    ];

    const mappings = await Prisma.serviceProviderMapping.findMany({
      where: { id: { in: mappingIds } },
      include: { service: true, provider: true },
    });

    // SERVICES SUMMARY
    const serviceMap = {};

    txns.forEach((txn) => {
      const map = mappings.find((m) => m.id === txn.serviceProviderMappingId);

      const key = map?.service?.code || "UNKNOWN";

      if (!serviceMap[key]) {
        serviceMap[key] = {
          name: map?.service?.name || "Unknown",
          provider: map?.provider?.code || "UNKNOWN",
          total: 0,
        };
      }

      serviceMap[key].total += Number(txn.amount);
    });

    const services = Object.values(serviceMap);

    // CHART
    const chartMap = {};

    txns.forEach((txn) => {
      const d = txn.initiatedAt;

      const label = formatDate(d);

      const map = mappings.find((m) => m.id === txn.serviceProviderMappingId);

      const serviceKey = map?.service?.code || "UNKNOWN";

      if (!chartMap[label]) {
        chartMap[label] = { label, total: 0 };
      }

      chartMap[label].total += Number(txn.amount);

      if (!chartMap[label][serviceKey]) {
        chartMap[label][serviceKey] = 0;
      }

      chartMap[label][serviceKey] += Number(txn.amount);

      if (!chartMap[label].SUCCESS) chartMap[label].SUCCESS = 0;
      if (!chartMap[label].FAILED) chartMap[label].FAILED = 0;
      if (!chartMap[label].PENDING) chartMap[label].PENDING = 0;

      // based on txn.status
      chartMap[label][txn.status] = (chartMap[label][txn.status] || 0) + 1;
    });

    const chart = Object.values(chartMap).sort(
      (a, b) => new Date(a.label) - new Date(b.label)
    );

    return {
      summary: {
        totalProfit: earningAgg._sum.amount || 0,
        totalGST: gstAgg._sum.amount || 0,
        totalTDS: tdsAgg._sum.amount || 0,
        totalPrimaryBalance,
        totalCommissionBalance,
        success,
        failed,
        pending,
        roleCounts,
        totalUsers,
      },
      services,
      chart,
    };
  }
}
