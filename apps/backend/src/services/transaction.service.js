import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export class TransactionService {
  static async createTransaction(data) {
    const {
      userId,
      walletId,
      serviceId,
      apiEntityId,
      amount,
      currency = "INR",
      paymentType,
      commissionAmount = 0,
      taxAmount = 0,
      feeAmount = 0,
      cashbackAmount = 0,
      idempotencyKey,
      referenceId,
      externalRefId,
      requestPayload,
      metadata,
    } = data;

    if (idempotencyKey) {
      const existingTx = await Prisma.transaction.findFirst({
        where: { idempotencyKey },
      });
      if (existingTx) {
        console.log("Returning existing transaction for idempotency key", {
          key: idempotencyKey,
          transactionId: existingTx.id,
        });
        return existingTx;
      }
    }

    let service = null;
    if (serviceId) {
      service = await Prisma.serviceProvider.findUnique({
        where: { id: serviceId },
      });
      if (!service) throw ApiError.notFound("Service not found");
    }

    const wallet = await Prisma.wallet.findUnique({
      where: { id: walletId },
      include: { user: true },
    });

    if (!wallet) throw ApiError.notFound("Wallet not found");
    if (wallet.userId !== userId)
      throw ApiError.badRequest("Wallet does not belong to user");

    const amountBigInt = BigInt(amount);
    const commissionAmountBigInt = BigInt(commissionAmount);
    const taxAmountBigInt = BigInt(taxAmount);
    const feeAmountBigInt = BigInt(feeAmount);
    const cashbackAmountBigInt = BigInt(cashbackAmount);

    const netAmount =
      amountBigInt -
      commissionAmountBigInt -
      taxAmountBigInt -
      feeAmountBigInt +
      cashbackAmountBigInt;

    if (wallet.balance < amountBigInt) {
      throw ApiError.badRequest("Insufficient balance");
    }

    const transaction = await Prisma.$transaction(async (tx) => {
      const txData = {
        userId,
        walletId,
        amount: amountBigInt,
        currency,
        netAmount,
        status: "PENDING",
        paymentType,
        commissionAmount: commissionAmountBigInt,
        taxAmount: taxAmountBigInt,
        feeAmount: feeAmountBigInt,
        cashbackAmount: cashbackAmountBigInt,
        initiatedAt: new Date(),
      };

      if (serviceId) txData.serviceId = serviceId;
      if (apiEntityId) txData.apiEntityId = apiEntityId;
      if (referenceId) txData.referenceId = referenceId;
      if (externalRefId) txData.externalRefId = externalRefId;
      if (idempotencyKey) txData.idempotencyKey = idempotencyKey;
      if (requestPayload) txData.requestPayload = requestPayload;
      if (metadata) txData.metadata = metadata;

      const newTx = await tx.transaction.create({
        data: txData,
        include: {
          service: { select: { name: true, code: true, type: true } },
          apiEntity: { select: { entityType: true, entityId: true } },
          user: {
            select: { firstName: true, lastName: true, phoneNumber: true },
          },
          wallet: { select: { currency: true } },
        },
      });

      const newBalance = wallet.balance - amountBigInt;

      const serviceType = service?.type || "GENERAL";
      const serviceName = service?.name || serviceType;

      await tx.ledgerEntry.create({
        data: {
          walletId,
          transactionId: newTx.id,
          entryType: "DEBIT",
          referenceType: "TRANSACTION",
          serviceId: serviceId || null,
          amount: amountBigInt,
          runningBalance: newBalance,
          narration: `Transaction initiated for ${serviceName} - ${paymentType}`,
          createdBy: userId,
          idempotencyKey: idempotencyKey || null,
        },
      });

      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: newBalance },
      });

      return newTx;
    });

    return transaction;
  }

  static async refundTransaction(data) {
    const { transactionId, initiatedBy, amount, reason, metadata } = data;

    const transaction = await Prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        wallet: true,
        service: { select: { name: true, type: true } },
      },
    });

    if (!transaction) throw ApiError.notFound("Transaction not found");
    if (transaction.status !== "SUCCESS") {
      throw ApiError.badRequest("Only successful transactions can be refunded");
    }

    const amountBigInt = BigInt(amount);
    const serviceName =
      transaction.service?.name ||
      transaction.service?.type ||
      "Unknown Service";

    const refund = await Prisma.$transaction(async (tx) => {
      const refundData = {
        transactionId,
        initiatedBy,
        amount: amountBigInt,
        status: "REFUNDED",
      };

      if (reason) refundData.reason = reason;
      if (metadata) refundData.metadata = metadata;

      const refundRecord = await tx.refund.create({
        data: refundData,
      });

      const latestLedger = await tx.ledgerEntry.findFirst({
        where: { walletId: transaction.walletId },
        orderBy: { createdAt: "desc" },
      });

      const runningBalance =
        (latestLedger?.runningBalance || transaction.wallet.balance) +
        amountBigInt;

      await tx.ledgerEntry.create({
        data: {
          walletId: transaction.walletId,
          transactionId,
          entryType: "CREDIT",
          referenceType: "REFUND",
          serviceId: transaction.serviceId,
          amount: amountBigInt,
          runningBalance,
          narration: `Refund for ${serviceName} transaction - ${reason || "No reason provided"}`,
          createdBy: initiatedBy,
        },
      });

      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: { balance: runningBalance },
      });

      await tx.transaction.update({
        where: { id: transactionId },
        data: { status: "REFUNDED" },
      });

      return {
        ...refundRecord,
        transactionReference: transaction.referenceId,
        serviceName,
      };
    });

    return refund;
  }

  static async getTransactions(filters) {
    const { userId, status, serviceId, apiEntityId, paymentType, page, limit } =
      filters;

    const where = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;
    if (serviceId) where.serviceId = serviceId;
    if (apiEntityId) where.apiEntityId = apiEntityId;
    if (paymentType) where.paymentType = paymentType;

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          service: { select: { name: true, code: true, type: true } },
          apiEntity: { select: { entityType: true, entityId: true } },
          user: {
            select: { firstName: true, lastName: true, phoneNumber: true },
          },
          wallet: { select: { id: true, currency: true } },
        },
      }),
      Prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getTransactionById(id) {
    const transaction = await Prisma.transaction.findUnique({
      where: { id },
      include: {
        service: { select: { name: true, code: true } },
        apiEntity: { select: { entityType: true, entityId: true } },
        user: {
          select: { firstName: true, lastName: true, phoneNumber: true },
        },
        wallet: { select: { id: true, currency: true } },
        ledgerEntries: {
          orderBy: { createdAt: "asc" },
          take: 10,
        },
        refunds: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        commissionEarnings: {
          include: {
            user: { select: { firstName: true, lastName: true } },
            fromUser: { select: { firstName: true, lastName: true } },
          },
          take: 10,
        },
      },
    });

    if (!transaction) throw ApiError.notFound("Transaction not found");
    return transaction;
  }

  static async updateTransactionStatus(data) {
    const {
      transactionId,
      status,
      providerReference,
      providerResponse,
      responsePayload,
    } = data;

    const transaction = await Prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        wallet: true,
        service: { select: { name: true, type: true } },
      },
    });

    if (!transaction) throw ApiError.notFound("Transaction not found");

    const updateData = {
      status,
    };

    if (status === "SUCCESS") {
      updateData.processedAt = new Date();
      updateData.completedAt = new Date();
    } else if (status === "FAILED") {
      updateData.processedAt = new Date();
    }

    if (providerReference) updateData.providerReference = providerReference;
    if (providerResponse) updateData.providerResponse = providerResponse;
    if (responsePayload) updateData.responsePayload = responsePayload;

    const serviceName =
      transaction.service?.name ||
      transaction.service?.type ||
      "Unknown Service";

    const updatedTx = await Prisma.$transaction(async (tx) => {
      const txUpdate = await tx.transaction.update({
        where: { id: transactionId },
        data: updateData,
        include: {
          service: { select: { name: true, type: true } },
          user: { select: { firstName: true, lastName: true } },
        },
      });

      if (status === "FAILED" && transaction.walletId) {
        const latestLedger = await tx.ledgerEntry.findFirst({
          where: { walletId: transaction.walletId },
          orderBy: { createdAt: "desc" },
        });

        const runningBalance =
          (latestLedger?.runningBalance || transaction.wallet.balance) +
          transaction.amount;

        await tx.ledgerEntry.create({
          data: {
            walletId: transaction.walletId,
            transactionId,
            entryType: "CREDIT",
            referenceType: "REFUND",
            serviceId: transaction.serviceId,
            amount: transaction.amount,
            runningBalance,
            narration: `${serviceName} transaction failed - amount refunded`,
            createdBy: transaction.userId,
          },
        });

        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: { balance: runningBalance },
        });
      }

      return txUpdate;
    });

    return updatedTx;
  }
}
