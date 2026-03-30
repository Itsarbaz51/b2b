import prisma from "../../db/db.js";

export default class ReportService {
  /**
   * 🔥 USER REPORT (CORRECT LOGIC)
   */
  static async getUserReport({ userId }) {
    // ✅ user ke wallet entries nikalo
    const where = {
      wallet: {
        userId: userId,
      },
    };

    // ✅ TOTAL CREDIT / DEBIT
    const data = await prisma.ledgerEntry.groupBy({
      by: ["entryType"],
      where,
      _sum: { amount: true },
    });

    let credit = 0;
    let debit = 0;

    data.forEach((item) => {
      const amt = Number(item._sum.amount || 0);

      if (item.entryType === "CREDIT") credit += amt;
      if (item.entryType === "DEBIT") debit += amt;
    });

    // 🔥 BREAKDOWN
    const breakdown = await prisma.ledgerEntry.groupBy({
      by: ["referenceType", "entryType"],
      where,
      _sum: { amount: true },
    });

    const summary = {};
    let profit = 0;

    const EARNING_TYPES = ["SURCHARGE", "COMMISSION"];

    breakdown.forEach((item) => {
      const key = item.referenceType;
      const amt = Number(item._sum.amount || 0);

      if (!summary[key]) summary[key] = 0;

      if (item.entryType === "CREDIT") {
        summary[key] += amt;
      } else {
        summary[key] -= amt;
      }

      // ✅ PROFIT = sirf jo user ko mila
      if (item.entryType === "CREDIT" && EARNING_TYPES.includes(key)) {
        profit += amt;
      }
    });

    return {
      totalCredit: credit,
      totalDebit: debit,
      netProfit: profit,
      breakdown: summary,
    };
  }

  /**
   * 🔥 ADMIN REPORT (ALL USERS)
   */
  static async getAdminReport() {
    const data = await prisma.ledgerEntry.groupBy({
      by: ["referenceType", "entryType"],
      _sum: { amount: true },
    });

    let totalCredit = 0;
    let totalDebit = 0;
    let profit = 0;

    // ✅ define earning types (future safe)
    const EARNING_TYPES = ["SURCHARGE"];

    data.forEach((item) => {
      const amt = Number(item._sum.amount || 0);
      const ref = item.referenceType;
      const type = item.entryType;

      if (type === "CREDIT") totalCredit += amt;
      if (type === "DEBIT") totalDebit += amt;

      // 🔥 PROFIT ONLY FROM EARNING TYPES
      if (type === "CREDIT" && EARNING_TYPES.includes(ref)) {
        profit += amt;
      }
    });

    return {
      totalCredit,
      totalDebit,
      netProfit: profit,
    };
  }

  /**
   * 🔥 SERVICE + PROVIDER REPORT (CORRECT)
   */
  static async getServiceReport({ userId }) {
    const where = userId
      ? {
          wallet: {
            userId,
          },
        }
      : {};

    const data = await prisma.ledgerEntry.findMany({
      where,
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

    // 🔥 earning types
    const EARNING_TYPES = ["SURCHARGE", "COMMISSION"];

    data.forEach((item) => {
      const ref = item.referenceType;

      // ❌ skip non-earning
      if (!EARNING_TYPES.includes(ref)) return;

      // ❌ only CREDIT (profit hi lena hai)
      if (item.entryType !== "CREDIT") return;

      const service = item.serviceProviderMapping?.service?.code || "UNKNOWN";

      const provider = item.serviceProviderMapping?.provider?.code || "UNKNOWN";

      const key = `${service}__${provider}`;

      if (!result[key]) {
        result[key] = {
          service,
          provider,
          profit: 0,
          txnCount: 0,
        };
      }

      const amt = Number(item.amount || 0);

      result[key].profit += amt;
      result[key].txnCount += 1;
    });

    return Object.values(result);
  }
}
