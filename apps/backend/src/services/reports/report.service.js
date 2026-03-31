import prisma from "../../db/db.js";

export default class ReportService {
  static async getUserReport({ userIds }) {
    const where =
      userIds && userIds.length > 0
        ? { wallet: { userId: { in: userIds } } }
        : {};

    const totals = await prisma.ledgerEntry.groupBy({
      by: ["entryType", "referenceType"], // ✅ FIX
      where,
      _sum: { amount: true },
    });

    let totalCredit = 0;
    let totalDebit = 0;

    const EARNING_TYPES = ["SURCHARGE", "COMMISSION"];
    const COST_TYPES = ["PROVIDER_COST", "PROVIDER_GST", "SURCHARGE_GST", "SURCHARGE"];

    totals.forEach((item) => {
      const amt = Number(item._sum.amount || 0);

      // ✅ EARNING (only real income)
      if (
        item.entryType === "CREDIT" &&
        EARNING_TYPES.includes(item.referenceType)
      ) {
        totalCredit += amt;
      }

      // ✅ COST (only real expense)
      if (
        item.entryType === "DEBIT" &&
        COST_TYPES.includes(item.referenceType)
      ) {
        totalDebit += amt;
      }
    });
    const earningData = await prisma.ledgerEntry.groupBy({
      by: ["referenceType", "entryType"],
      where,
      _sum: { amount: true },
    });

    let profit = 0;
    const breakdown = {};

    earningData.forEach((item) => {
      if (
        item.entryType === "CREDIT" &&
        EARNING_TYPES.includes(item.referenceType)
      ) {
        const amt = Number(item._sum.amount || 0);

        breakdown[item.referenceType] =
          (breakdown[item.referenceType] || 0) + amt;

        profit += amt;
      }
    });

    return {
      totalCredit,
      totalDebit,
      netProfit: profit,
      breakdown,
    };
  }

  static async getServiceReport({ userIds }) {
    const where =
      userIds && userIds.length > 0
        ? { wallet: { userId: { in: userIds } } }
        : {};

    const data = await prisma.ledgerEntry.findMany({
      where: {
        ...where,
        entryType: "CREDIT",
        referenceType: {
          in: ["SURCHARGE", "COMMISSION"],
        },
      },
      include: {
        serviceProviderMapping: {
          include: {
            service: true,
            provider: true,
          },
        },
      },
    });

    const result = {};

    data.forEach((item) => {
      const service = item.serviceProviderMapping?.service?.code || "UNKNOWN";

      const provider = item.serviceProviderMapping?.provider?.code || "UNKNOWN";

      const key = `${service}__${provider}`;

      if (!result[key]) {
        result[key] = {
          service,
          provider,
          profit: 0,
        };
      }

      result[key].profit += Number(item.amount || 0);
    });

    return Object.values(result);
  }
}
