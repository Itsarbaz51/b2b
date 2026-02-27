import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export class WalletService {
  static async getWalletByUserId(userId, walletType) {
    const where = { userId, isActive: true };
    if (walletType) {
      where.walletType = walletType;
    }

    const wallet = await Prisma.wallet.findFirst({
      where,
      include: {
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!wallet) {
      throw ApiError.notFound("Wallet not found for user");
    }

    const latestLedger = await Prisma.ledgerEntry.findFirst({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      select: { runningBalance: true },
    });

    const currentBalance = latestLedger
      ? latestLedger.runningBalance
      : wallet.balance;

    return {
      ...wallet,
      balance: currentBalance,
      availableBalance: wallet.availableBalance,
      holdBalance: wallet.holdBalance,
    };
  }

  static async getWalletBalance(userId, walletType) {
    const where = { userId, isActive: true };
    if (walletType) {
      where.walletType = walletType;
    }

    const wallet = await Prisma.wallet.findFirst({
      where,
    });

    if (!wallet) {
      throw ApiError.notFound("Wallet not found for user");
    }

    const latestLedger = await Prisma.ledgerEntry.findFirst({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      select: { runningBalance: true },
    });

    return {
      balance: latestLedger ? latestLedger.runningBalance : wallet.balance,
      availableBalance: wallet.availableBalance,
      holdBalance: wallet.holdBalance,
    };
  }

  static async creditWallet(
    userId,
    amount,
    narration,
    createdBy,
    idempotencyKey,
    walletType,
    referenceType,
    serviceId
  ) {
    if (amount <= 0) throw ApiError.badRequest("Amount must be greater than 0");

    return await Prisma.$transaction(async (tx) => {
      const where = { userId, isActive: true };
      if (walletType) {
        where.walletType = walletType;
      }

      const wallet = await tx.wallet.findFirst({
        where,
        select: {
          id: true,
          balance: true,
          availableBalance: true,
          holdBalance: true,
          userId: true,
          walletType: true,
        },
      });

      if (!wallet) throw ApiError.notFound("Wallet not found");

      const currentBalance = BigInt(wallet.balance?.toString() || "0");
      const currentAvailableBalance = BigInt(
        wallet.availableBalance?.toString() || "0"
      );
      const creditAmount = BigInt(amount);
      const newBalance = currentBalance + creditAmount;
      const newAvailableBalance = currentAvailableBalance + creditAmount;

      let serviceDetails = null;
      if (serviceId) {
        serviceDetails = await tx.serviceProvider.findUnique({
          where: { id: serviceId },
          select: { name: true, type: true },
        });
      }

      const serviceNarration = serviceDetails
        ? `${serviceDetails.type} - ${serviceDetails.name}`
        : "Wallet credit";

      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          entryType: "CREDIT",
          referenceType: referenceType || "ADJUSTMENT",
          serviceId: serviceId || null,
          amount: creditAmount,
          runningBalance: newBalance,
          narration: narration || serviceNarration,
          createdBy: createdBy || userId,
          idempotencyKey: idempotencyKey ?? null,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: newBalance,
          availableBalance: newAvailableBalance,
          version: { increment: 1 },
        },
      });

      console.log("Wallet credited successfully", {
        walletId: wallet.id,
        userId,
        walletType: wallet.walletType,
        serviceId,
        amount,
        idempotencyKey,
      });

      return {
        walletId: wallet.id,
        userId: wallet.userId,
        walletType: wallet.walletType,
        previousBalance: Number(currentBalance),
        previousAvailableBalance: Number(currentAvailableBalance),
        creditAmount: amount,
        newBalance: Number(newBalance),
        newAvailableBalance: Number(newAvailableBalance),
        ledgerEntryId: ledgerEntry.id,
        timestamp: new Date(),
      };
    });
  }

  static async debitWallet(
    userId,
    amount,
    narration,
    createdBy,
    idempotencyKey,
    walletType,
    referenceType,
    serviceId
  ) {
    if (amount <= 0) throw ApiError.badRequest("Amount must be greater than 0");

    return await Prisma.$transaction(async (tx) => {
      const where = { userId, isActive: true };
      if (walletType) {
        where.walletType = walletType;
      }

      const wallet = await tx.wallet.findFirst({
        where,
        select: {
          id: true,
          balance: true,
          availableBalance: true,
          holdBalance: true,
          userId: true,
          walletType: true,
        },
      });

      if (!wallet) throw ApiError.notFound("Wallet not found");

      const currentBalance = BigInt(wallet.balance?.toString() || "0");
      const currentAvailableBalance = BigInt(
        wallet.availableBalance?.toString() || "0"
      );
      const debitAmount = BigInt(amount);

      if (currentAvailableBalance < debitAmount) {
        throw ApiError.badRequest("Insufficient available balance");
      }

      const newBalance = currentBalance - debitAmount;
      const newAvailableBalance = currentAvailableBalance - debitAmount;

      let serviceDetails = null;
      if (serviceId) {
        serviceDetails = await tx.serviceProvider.findUnique({
          where: { id: serviceId },
          select: { name: true, type: true },
        });
      }

      const serviceNarration = serviceDetails
        ? `${serviceDetails.type} - ${serviceDetails.name}`
        : "Wallet debit";

      const ledgerEntry = await tx.ledgerEntry.create({
        data: {
          walletId: wallet.id,
          entryType: "DEBIT",
          referenceType: referenceType || "ADJUSTMENT",
          serviceId: serviceId || null,
          amount: debitAmount,
          runningBalance: newBalance,
          narration: narration || serviceNarration,
          createdBy: createdBy || userId,
          idempotencyKey: idempotencyKey || null,
        },
      });

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: newBalance,
          availableBalance: newAvailableBalance,
          version: { increment: 1 },
        },
      });

      console.log("Wallet debited successfully", {
        walletId: wallet.id,
        userId,
        walletType: wallet.walletType,
        serviceId,
        amount,
        idempotencyKey,
      });

      return {
        walletId: wallet.id,
        userId: wallet.userId,
        walletType: wallet.walletType,
        previousBalance: Number(currentBalance),
        previousAvailableBalance: Number(currentAvailableBalance),
        debitAmount: amount,
        newBalance: Number(newBalance),
        newAvailableBalance: Number(newAvailableBalance),
        ledgerEntryId: ledgerEntry.id,
        timestamp: new Date(),
      };
    });
  }

  static async holdAmount(
    userId,
    amount,
    narration,
    createdBy,
    idempotencyKey,
    walletType
  ) {
    if (amount <= 0) throw ApiError.badRequest("Amount must be greater than 0");

    return await Prisma.$transaction(async (tx) => {
      const where = { userId, isActive: true };
      if (walletType) {
        where.walletType = walletType;
      }

      const wallet = await tx.wallet.findFirst({
        where,
        select: {
          id: true,
          balance: true,
          availableBalance: true,
          holdBalance: true,
          userId: true,
          walletType: true,
        },
      });

      if (!wallet) throw ApiError.notFound("Wallet not found");

      const currentAvailableBalance = BigInt(
        wallet.availableBalance?.toString() || "0"
      );
      const currentHoldBalance = BigInt(wallet.holdBalance?.toString() || "0");
      const holdAmount = BigInt(amount);

      if (currentAvailableBalance < holdAmount) {
        throw ApiError.badRequest("Insufficient available balance to hold");
      }

      const newAvailableBalance = currentAvailableBalance - holdAmount;
      const newHoldBalance = currentHoldBalance + holdAmount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: newAvailableBalance,
          holdBalance: newHoldBalance,
          version: { increment: 1 },
        },
      });

      console.log("Amount held successfully", {
        walletId: wallet.id,
        userId,
        walletType: wallet.walletType,
        amount,
        idempotencyKey,
      });

      return {
        walletId: wallet.id,
        userId: wallet.userId,
        walletType: wallet.walletType,
        previousAvailableBalance: Number(currentAvailableBalance),
        previousHoldBalance: Number(currentHoldBalance),
        holdAmount: amount,
        newAvailableBalance: Number(newAvailableBalance),
        newHoldBalance: Number(newHoldBalance),
        timestamp: new Date(),
      };
    });
  }

  static async releaseHoldAmount(
    userId,
    amount,
    narration,
    createdBy,
    idempotencyKey,
    walletType
  ) {
    if (amount <= 0) throw ApiError.badRequest("Amount must be greater than 0");

    return await Prisma.$transaction(async (tx) => {
      const where = { userId, isActive: true };
      if (walletType) {
        where.walletType = walletType;
      }

      const wallet = await tx.wallet.findFirst({
        where,
        select: {
          id: true,
          balance: true,
          availableBalance: true,
          holdBalance: true,
          userId: true,
          walletType: true,
        },
      });

      if (!wallet) throw ApiError.notFound("Wallet not found");

      const currentHoldBalance = BigInt(wallet.holdBalance?.toString() || "0");
      const currentAvailableBalance = BigInt(
        wallet.availableBalance?.toString() || "0"
      );
      const releaseAmount = BigInt(amount);

      if (currentHoldBalance < releaseAmount) {
        throw ApiError.badRequest("Insufficient hold balance to release");
      }

      const newHoldBalance = currentHoldBalance - releaseAmount;
      const newAvailableBalance = currentAvailableBalance + releaseAmount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: newAvailableBalance,
          holdBalance: newHoldBalance,
          version: { increment: 1 },
        },
      });

      console.log("Hold amount released successfully", {
        walletId: wallet.id,
        userId,
        walletType: wallet.walletType,
        amount,
        idempotencyKey,
      });

      return {
        walletId: wallet.id,
        userId: wallet.userId,
        walletType: wallet.walletType,
        previousHoldBalance: Number(currentHoldBalance),
        previousAvailableBalance: Number(currentAvailableBalance),
        releasedAmount: amount,
        newHoldBalance: Number(newHoldBalance),
        newAvailableBalance: Number(newAvailableBalance),
        timestamp: new Date(),
      };
    });
  }

  static async getWalletTransactions(
    userId,
    page = 1,
    limit = 10,
    walletType
  ) {
    const where = { userId, isActive: true };
    if (walletType) {
      where.walletType = walletType;
    }

    const wallet = await Prisma.wallet.findFirst({
      where,
      select: { id: true },
    });

    if (!wallet) throw ApiError.notFound("Wallet not found");

    const skip = (page - 1) * limit;

    const [ledgerEntries, total] = await Promise.all([
      Prisma.ledgerEntry.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          transaction: {
            select: {
              id: true,
              service: { select: { name: true, code: true, type: true } },
              status: true,
              paymentType: true,
            },
          },
          service: {
            select: { name: true, type: true },
          },
        },
      }),
      Prisma.ledgerEntry.count({ where: { walletId: wallet.id } }),
    ]);

    return {
      data: ledgerEntries,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getUserWallets(userId) {
    const wallets = await Prisma.wallet.findMany({
      where: { userId, isActive: true },
      orderBy: { walletType: "asc" },
      include: {
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            service: {
              select: { name: true, type: true },
            },
          },
        },
      },
    });

    if (!wallets.length) {
      throw ApiError.notFound("No wallets found for user");
    }

    return wallets;
  }
}