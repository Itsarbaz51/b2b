import dayjs from "dayjs";

export class UserLimitService {
  static async checkLimit(tx, userId, amount) {
    const limit = await tx.userLimit.findUnique({
      where: { userId },
    });

    if (!limit) return;

    if (limit.perTxnLimit && amount > limit.perTxnLimit)
      throw ApiError.badRequest("Per transaction limit exceeded");

    const todayStart = dayjs().startOf("day").toDate();

    const todaySum = await tx.transaction.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        status: "SUCCESS",
        createdAt: { gte: todayStart },
      },
    });

    if (
      limit.dailyLimit &&
      (todaySum._sum.amount || 0) + amount > limit.dailyLimit
    ) {
      throw ApiError.badRequest("Daily limit exceeded");
    }
  }
}
