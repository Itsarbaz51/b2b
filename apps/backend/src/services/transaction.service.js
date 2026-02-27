import CommissionEarningService from "./commissionEarning.service.js";
import WebhookService from "./webhook.service.js";
import { ApiError } from "../utils/ApiError.js";
import Prisma from "../db/db.js";

export default class TransactionService {
  static async createTransaction({
    userId,
    serviceId,
    amount,
    referenceId,
    createdBy,
  }) {
    if (!userId || !amount) {
      throw ApiError.badRequest("userId & amount required");
    }

    const txn = await Prisma.transaction.create({
      data: {
        userId,
        serviceId,
        amount: BigInt(amount),
        referenceId,
        status: "SUCCESS",
        createdBy,
      },
    });

    // Process commission
    await CommissionEarningService.processEarning({
      transactionId: txn.id,
      userId,
      serviceId,
      amount,
      createdBy,
    });

    // 📡 Send webhook
    await WebhookService.trigger("TRANSACTION_SUCCESS", txn);

    return txn;
  }
}
