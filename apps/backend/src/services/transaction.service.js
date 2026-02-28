import crypto from "crypto";
import { ApiError } from "../../utils/ApiError.js";

export default class TransactionService {
  static async create(
    tx,
    {
      userId,
      serviceId,
      amount,
      paymentType = "COLLECTION",
      entityType,
      idempotencyKey,
    }
  ) {
    if (!userId || !serviceId)
      throw ApiError.badRequest("User and Service required");

    // 🔒 Idempotency Check
    if (idempotencyKey) {
      const existingTxn = await tx.transaction.findUnique({
        where: { idempotencyKey },
      });

      if (existingTxn) return existingTxn;
    }

    // 1️⃣ Create Transaction
    const transaction = await tx.transaction.create({
      data: {
        userId,
        serviceId,
        amount,
        netAmount: amount,
        paymentType,
        status: "PENDING",
        idempotencyKey,
      },
    });

    // 2️⃣ Create ApiEntity
    const apiEntity = await tx.apiEntity.create({
      data: {
        entityType,
        entityId: crypto.randomUUID(),
        userId,
        serviceId,
        status: "PENDING",
      },
    });

    return {
      transaction,
      apiEntity,
    };
  }
}
