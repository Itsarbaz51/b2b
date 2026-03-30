import prisma from "../../db/db.js";

export default class ReportService {
  /**
   * 🔥 USER REPORT (CORRECT LOGIC)
   */
  static async getUserReport({ userId }) {
    const data = await prisma.ledgerEntry.groupBy({
      by: ["entryType"],
      where: { createdBy: userId },
      _sum: { amount: true },
    });

    let credit = 0;
    let debit = 0;

    data.forEach((item) => {
      const amt = Number(item._sum.amount || 0);

      if (item.entryType === "CREDIT") {
        credit += amt;
      } else if (item.entryType === "DEBIT") {
        debit += amt;
      }
    });

    // 🔥 breakdown (NO EXTRA MATH)
    const breakdown = await prisma.ledgerEntry.groupBy({
      by: ["referenceType", "entryType"],
      where: { createdBy: userId },
      _sum: { amount: true },
    });

    const summary = {};

    breakdown.forEach((item) => {
      const key = item.referenceType;
      const amt = Number(item._sum.amount || 0);

      if (!summary[key]) {
        summary[key] = 0;
      }

      if (item.entryType === "CREDIT") {
        summary[key] += amt;
      } else {
        summary[key] -= amt;
      }
    });

    return {
      totalCredit: credit,
      totalDebit: debit,
      netProfit: credit - debit, // 🔥 FINAL TRUTH
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
    const EARNING_TYPES = ["SURCHARGE", "USER_GST"];

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
    const where = userId ? { userId } : {};

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

    // 🔥 only earning types
    const EARNING_TYPES = ["SURCHARGE", "USER_GST"];

    data.forEach((item) => {
      const service = item.serviceProviderMapping?.service?.code || "UNKNOWN";
      const provider = item.serviceProviderMapping?.provider?.code || "UNKNOWN";

      const ref = item.referenceType;

      // ❌ skip non-earning (important)
      if (!EARNING_TYPES.includes(ref)) return;

      const key = `${service}__${provider}`;

      if (!result[key]) {
        result[key] = {
          service,
          provider,
          profit: 0,
        };
      }

      const amt = Number(item.amount || 0);

      // ✅ only CREDIT earning
      if (item.entryType === "CREDIT") {
        result[key].profit += amt;
      }
    });

    return Object.values(result);
  }
}
