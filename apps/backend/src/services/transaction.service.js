import { ApiError } from "../utils/ApiError.js";
import ApiEntityService from "./apiEntity.service.js";

export default class TransactionService {
  // CREATE
  static async create(
    tx,
    {
      userId,
      walletId,
      serviceProviderMappingId,
      amount,
      idempotencyKey,
      requestPayload,
      pricing,
    }
  ) {
    if (!userId || !walletId || !serviceProviderMappingId)
      throw ApiError.badRequest("Required fields missing");

    // Idempotency Check
    if (idempotencyKey) {
      const existingTxn = await tx.transaction.findUnique({
        where: { idempotencyKey },
        include: { apiEntity: true },
      });

      if (existingTxn) {
        return {
          transaction: existingTxn,
          apiEntity: existingTxn.apiEntity,
        };
      }
    }

    const txnId = `TXN-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`;

    const apiEntity = await ApiEntityService.create(tx, {
      userId,
      serviceProviderMappingId,
      requestPayload,
    });

    const transaction = await tx.transaction.create({
      data: {
        txnId,
        userId,
        walletId,
        serviceProviderMappingId,
        apiEntityId: apiEntity.id,
        amount,
        pricing,
        netAmount: amount,
        status: "PENDING",
        idempotencyKey,
      },
    });

    return { transaction, apiEntity };
  }

  // UPDATE (Provider response / Final status)
  static async update(
    tx,
    { transactionId, status, netAmount, providerReference, providerResponse }
  ) {
    if (!transactionId) throw ApiError.badRequest("TransactionId required");

    const existingTxn = await tx.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existingTxn) throw ApiError.notFound("Transaction not found");

    if (existingTxn.status === "SUCCESS")
      throw ApiError.badRequest("Transaction already completed");

    // 1️⃣ Update Transaction
    const updatedTxn = await tx.transaction.update({
      where: { id: transactionId },
      data: {
        status: status ?? existingTxn.status,
        netAmount: netAmount ?? existingTxn.netAmount,
        providerReference,
        providerResponse,
        processedAt: status ? new Date() : undefined,
        completedAt: status === "SUCCESS" ? new Date() : undefined,
      },
    });

    // 2️⃣ Update ApiEntity accordingly
    if (status) {
      await tx.apiEntity.update({
        where: { id: existingTxn.apiEntityId },
        data: {
          status,
          providerFinalData: providerResponse,
          completedAt: status === "VALID" ? new Date() : undefined,
          errorData: status === "FAILED" ? providerResponse : undefined,
        },
      });
    }

    return updatedTxn;
  }
}
