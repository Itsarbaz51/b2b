import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
import WebhookService from "./webhook.service.js";

export default class RefundService {
  static async processRefund(transactionId, reason) {
    const txn = await Prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!txn) throw ApiError.notFound("Transaction not found");

    await Prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "REFUNDED" },
    });

    // Reverse earnings
    await Prisma.commissionEarning.updateMany({
      where: { transactionId },
      data: {
        netAmount: 0n,
      },
    });

    await WebhookService.trigger("TRANSACTION_REFUND", txn);

    return { success: true };
  }
}
