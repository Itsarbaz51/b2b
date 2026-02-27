import Razorpay from "razorpay";
import crypto from "crypto";
import Prisma from "../../db/db.js";
import { ApiError } from "../../utils/ApiError.js";

import pkg from "@prisma/client";

import { ServiceProviderService } from "../service.service.js";
import S3Service from "../../utils/S3Service.js";
import { TransactionService } from "../transaction.service.js";
import { LedgerService } from "../ledger.service.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const { EntityStatus, PaymentType } = pkg;

class FundRequestService {
  // List fund requests with all 4 pillars
  static async listFundRequests(params, user) {
    const {
      status = "ALL",
      page = 1,
      limit = 10,
      sort = "desc",
      search,
      paymentType,
      startDate,
      endDate,
    } = params;

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build where clause based on user role
    let where = {};

    if (user.role.name === "ADMIN") {
      // Admin can see all requests from their sub-users
      const childUsers = await Prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });

      const childUserIds = childUsers.map((u) => u.id);
      if (childUserIds.length === 0) {
        return {
          data: [],
          meta: { page: pageNum, limit: limitNum, total: 0, totalPages: 0 },
        };
      }
      where.userId = { in: childUserIds };
    } else {
      // Regular users can only see their own requests
      where.userId = user.id;
    }

    // Fund requests filter
    where.paymentType = {
      in: ["FUND_REQ_BANK", "FUND_REQ_RAZORPAY"],
    };

    // Apply filters
    if (status && status !== "ALL") {
      where.status = status;
    }

    if (paymentType) {
      where.paymentType = paymentType;
    }

    if (search) {
      where.OR = [
        { referenceId: { contains: search } },
        { externalRefId: { contains: search } },
        { providerReference: { contains: search } },
        { user: { firstName: { contains: search } } },
        { user: { lastName: { contains: search } } },
      ];
    }

    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    // Fetch transactions with all relations
    const fundRequests = await Prisma.transaction.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { createdAt: sort === "asc" ? "asc" : "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
        wallet: {
          select: {
            id: true,
            walletType: true,
            balance: true,
          },
        },
        service: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        apiEntity: {
          select: {
            id: true,
            entityType: true,
            entityId: true,
            status: true,
          },
        },
        ledgerEntries: {
          select: {
            id: true,
            entryType: true,
            amount: true,
            createdAt: true,
          },
        },
        apiWebhooks: {
          select: {
            id: true,
            eventType: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    const total = await Prisma.transaction.count({ where });

    // Format response
    const formattedData = fundRequests.map((request) => ({
      id: request.id,
      referenceId: request.referenceId,
      externalRefId: request.externalRefId,
      amount: Number(request.amount),
      netAmount: Number(request.netAmount),
      paymentType: request.paymentType,
      status: request.status,
      provider: request.service?.code || "MANUAL",
      providerReference: request.providerReference,

      // User info
      user: {
        id: request.user.id,
        name: `${request.user.firstName} ${request.user.lastName}`,
        phone: request.user.phoneNumber,
        email: request.user.email,
      },

      // Wallet info
      wallet: {
        id: request.wallet.id,
        type: request.wallet.walletType,
        balance: Number(request.wallet.balance),
      },

      // ApiEntity info
      apiEntity: request.apiEntity
        ? {
            id: request.apiEntity.id,
            entityType: request.apiEntity.entityType,
            entityId: request.apiEntity.entityId,
            status: request.apiEntity.status,
          }
        : null,

      // Ledger entries
      ledgerEntries: request.ledgerEntries.map((entry) => ({
        id: entry.id,
        entryType: entry.entryType,
        amount: Number(entry.amount),
        createdAt: entry.createdAt,
      })),

      // Webhooks
      webhooks: request.apiWebhooks.map((webhook) => ({
        id: webhook.id,
        eventType: webhook.eventType,
        status: webhook.status,
        createdAt: webhook.createdAt,
      })),

      metadata: request.metadata,
      createdAt: request.createdAt,
      processedAt: request.processedAt,
      completedAt: request.completedAt,
    }));

    return {
      data: formattedData,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  // Get single fund request with all 4 pillars
  static async getFundRequestById(id, user) {
    const fundRequest = await Prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
          },
        },
        wallet: {
          select: {
            id: true,
            walletType: true,
            balance: true,
            availableBalance: true,
            holdBalance: true,
          },
        },
        service: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        apiEntity: {
          select: {
            id: true,
            entityType: true,
            entityId: true,
            status: true,
            provider: true,
            providerData: true,
            metadata: true,
          },
        },
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            entryType: true,
            amount: true,
            runningBalance: true,
            narration: true,
            referenceType: true,
            createdAt: true,
          },
        },
        apiWebhooks: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            eventType: true,
            status: true,
            payload: true,
            attempts: true,
            response: true,
            createdAt: true,
          },
        },
        commissionEarnings: {
          select: {
            id: true,
            amount: Number,
            commissionAmount: true,
            netAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!fundRequest) {
      throw ApiError.notFound("Fund request not found");
    }

    // Check permissions
    if (user.role.name !== "ADMIN" && fundRequest.userId !== user.id) {
      throw ApiError.forbidden("Access denied");
    }

    // Check if it's a fund request type
    if (
      !["FUND_REQ_BANK", "FUND_REQ_RAZORPAY"].includes(fundRequest.paymentType)
    ) {
      throw ApiError.badRequest("This is not a fund request");
    }

    return {
      id: fundRequest.id,
      referenceId: fundRequest.referenceId,
      externalRefId: fundRequest.externalRefId,
      amount: Number(fundRequest.amount),
      netAmount: Number(fundRequest.netAmount),
      paymentType: fundRequest.paymentType,
      status: fundRequest.status,

      // Provider info
      provider: fundRequest.service?.code || "MANUAL",
      providerReference: fundRequest.providerReference,

      // User info
      user: {
        id: fundRequest.user.id,
        name: `${fundRequest.user.firstName} ${fundRequest.user.lastName}`,
        phone: fundRequest.user.phoneNumber,
        email: fundRequest.user.email,
      },

      // Wallet info
      wallet: {
        id: fundRequest.wallet.id,
        type: fundRequest.wallet.walletType,
        balance: Number(fundRequest.wallet.balance),
        availableBalance: Number(fundRequest.wallet.availableBalance),
        holdBalance: Number(fundRequest.wallet.holdBalance),
      },

      // ApiEntity info
      apiEntity: fundRequest.apiEntity,

      // Ledger entries
      ledgerEntries: fundRequest.ledgerEntries.map((entry) => ({
        ...entry,
        amount: Number(entry.amount),
        runningBalance: Number(entry.runningBalance),
      })),

      // Webhooks
      webhooks: fundRequest.apiWebhooks,

      // Commission
      commissionEarnings: fundRequest.commissionEarnings.map((earning) => ({
        ...earning,
        amount: Number(earning.amount),
        commissionAmount: Number(earning.commissionAmount),
        netAmount: Number(earning.netAmount),
      })),

      metadata: fundRequest.metadata,
      requestPayload: fundRequest.requestPayload,
      responsePayload: fundRequest.responsePayload,
      providerResponse: fundRequest.providerResponse,
      createdAt: fundRequest.createdAt,
      processedAt: fundRequest.processedAt,
      completedAt: fundRequest.completedAt,
    };
  }

  // Create new fund request with BANK TRANSFER & RAZORPAY
  static async createFundRequest(payload, user, files) {
    const {
      amount,
      provider,
      paymentId,
      orderId,
      rrn,
      transactionDate,
      notes,
    } = payload;

    if (!user.id)
      throw ApiError.internal("Failed to get user id in fund request");

    if (!amount || !provider) {
      throw ApiError.badRequest("Amount and provider are required");
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      throw ApiError.badRequest("Amount must be a valid number greater than 0");
    }

    const userWallet = await Prisma.wallet.findFirst({
      where: {
        userId: user.id,
        walletType: "PRIMARY",
      },
    });

    if (!userWallet) {
      throw ApiError.notFound("User wallet not found");
    }

    // Upload payment image if provided
    let paymentImageUrl = null;
    if (files?.paymentImage?.[0]) {
      paymentImageUrl = await S3Service.upload(
        files.paymentImage[0].path,
        "fund-requests"
      );
      await Helper.deleteOldImage(files.paymentImage[0].path);
    }

    // Determine payment type and service
    let paymentType, serviceCode, serviceId, apiProvider;

    if (provider === "BANK_TRANSFER") {
      paymentType = "BANK_TRANSFER";
      serviceCode = "BANK_TRANSFER";
      apiProvider = "OTHER";
    } else if (provider === "RAZORPAY") {
      paymentType = "RAZORPAY";
      serviceCode = "RAZORPAY";
      apiProvider = "RAZORPAY";
    }

    // Get or create service provider
    let service = await Prisma.serviceProvider.findFirst({
      where: { code: serviceCode },
    });

    if (!service) {
      service = await ServiceProviderService.create({
        type: "BANK TRANSFER",
        code: serviceCode,
        name: serviceCode,
        createdBy: user.id,
        isActive: true,
      });
    }

    // Create ApiEntity for fund request
    const apiEntity = await Prisma.apiEntity.create({
      data: {
        entityType: "fund_request",
        entityId: `FUND_REQ_${Date.now()}`,
        userId: user.id,
        serviceId: service.id,
        provider: apiProvider,
        status: EntityStatus.PENDING,
        providerData: {
          provider,
          amount: amountNum,
          paymentId,
          orderId,
          rrn,
        },
        metadata: {
          paymentType,
          amount: amountNum,
          transactionDate: transactionDate || new Date().toISOString(),
          notes,
        },
        isActive: true,
      },
    });

    // Create transaction as fund request
    const fundRequest = await TransactionService.createTransaction({
      userId: user.id,
      walletId: userWallet.id,
      serviceId: service.id,
      apiEntityId: apiEntity.id,
      amount: amountNum,
      paymentType: PaymentType.FUND_REQUEST,
      currency: "INR",
      referenceId: paymentId,
      externalRefId: orderId,
      requestPayload: { provider, amount: amountNum, rrn, transactionDate },
      metadata: { provider, rrn, transactionDate },
    });

    await LedgerService.createEntry({
      walletId: userWallet.id,
      transactionId: fundRequest.id,
      entryType: "CREDIT",
      referenceType: "TRANSACTION",
      amount: 0, // after approve fund request then update
      runningBalance: userWallet.balance,
      narration: `Fund request created - ${paymentType}`,
      createdBy: user.id,
      metadata: {
        status: "PENDING",
        expectedAmount: amountNum,
      },
    });

    return {
      id: fundRequest.id,
      referenceId: fundRequest.referenceId,
      amount: Number(fundRequest.amount),
      paymentType: fundRequest.paymentType,
      status: fundRequest.status,
      provider: serviceCode,
      apiEntity: {
        id: apiEntity.id,
        entityType: apiEntity.entityType,
        entityId: apiEntity.entityId,
      },
      createdAt: fundRequest.createdAt,
    };
  }

  // Update fund request status with all 4 pillars
  static async updateFundRequestStatus(id, payload, user) {
    if (user.role.name !== "ADMIN") {
      throw ApiError.forbidden("Only admins can update fund request status");
    }

    const { status, rejectionReason } = payload;

    const fundRequest = await Prisma.transaction.findUnique({
      where: { id },
      include: {
        user: true,
        wallet: true,
        apiEntity: true,
      },
    });

    if (!fundRequest) {
      throw ApiError.notFound("Fund request not found");
    }

    if (
      !["FUND_REQ_BANK", "FUND_REQ_RAZORPAY"].includes(fundRequest.paymentType)
    ) {
      throw ApiError.badRequest("This is not a fund request");
    }

    if (fundRequest.status !== "PENDING") {
      throw ApiError.badRequest("This fund request is already processed");
    }

    // Start transaction for all updates
    const result = await Prisma.$transaction(async (prisma) => {
      const updateData = {
        status,
        updatedAt: new Date(),
        ...(status === "SUCCESS"
          ? { processedAt: new Date(), completedAt: new Date() }
          : {}),
        ...(status === "FAILED" ? { processedAt: new Date() } : {}),
      };

      // Update ApiEntity status
      if (fundRequest.apiEntityId) {
        await prisma.apiEntity.update({
          where: { id: fundRequest.apiEntityId },
          data: {
            status: status === "SUCCESS" ? "ACTIVE" : "REJECTED",
            updatedAt: new Date(),
            ...(status === "SUCCESS" ? { verifiedAt: new Date() } : {}),
          },
        });
      }

      // If approved, update user wallet balance and create ledger entries
      if (status === "SUCCESS") {
        // Update wallet balance
        const updatedWallet = await prisma.wallet.update({
          where: { id: fundRequest.walletId },
          data: {
            balance: { increment: fundRequest.amount },
            availableBalance: { increment: fundRequest.amount },
            version: { increment: 1 },
          },
        });

        // Create successful ledger entry
        await prisma.ledgerEntry.create({
          data: {
            transactionId: fundRequest.id,
            walletId: fundRequest.walletId,
            entryType: "CREDIT",
            referenceType: "TRANSACTION",
            amount: fundRequest.amount,
            runningBalance: Number(updatedWallet.balance),
            narration: `Funds added via ${fundRequest.paymentType === "FUND_REQ_BANK" ? "Bank Transfer" : "Razorpay"}`,
            createdBy: user.id,
            metadata: {
              approvedBy: user.id,
              approvedAt: new Date().toISOString(),
            },
          },
        });

        // Create webhook for successful funding
        await prisma.apiWebhook.create({
          data: {
            transactionId: fundRequest.id,
            apiEntityId: fundRequest.apiEntityId,
            provider:
              fundRequest.paymentType === "FUND_REQ_RAZORPAY"
                ? "RAZORPAY"
                : "OTHER",
            eventType: "FUND_REQUEST_APPROVED",
            payload: {
              transactionId: fundRequest.id,
              amount: Number(fundRequest.amount),
              userId: fundRequest.userId,
              approvedBy: user.id,
              timestamp: new Date().toISOString(),
            },
            status: "PENDING",
          },
        });

        updateData.metadata = {
          ...fundRequest.metadata,
          approvedBy: user.id,
          approvedAt: new Date().toISOString(),
          rejectionReason: null,
        };
      } else if (status === "FAILED") {
        // Create failed ledger entry
        await prisma.ledgerEntry.create({
          data: {
            transactionId: fundRequest.id,
            walletId: fundRequest.walletId,
            entryType: "DEBIT",
            referenceType: "TRANSACTION",
            amount: 0,
            runningBalance: Number(fundRequest.wallet.balance),
            narration: `Fund request rejected - ${rejectionReason || "No reason provided"}`,
            createdBy: user.id,
            metadata: {
              rejectedBy: user.id,
              rejectedAt: new Date().toISOString(),
              rejectionReason: rejectionReason,
            },
          },
        });

        updateData.metadata = {
          ...fundRequest.metadata,
          rejectedBy: user.id,
          rejectedAt: new Date().toISOString(),
          rejectionReason: rejectionReason || "Request rejected by admin",
        };
      }

      // Update transaction
      const updatedRequest = await prisma.transaction.update({
        where: { id },
        data: updateData,
      });

      return updatedRequest;
    });

    return {
      id: result.id,
      status: result.status,
      updatedAt: result.updatedAt,
    };
  }

  // Verify Razorpay payment with webhook creation
  static async verifyRazorpayPayment(payload, user) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      payload;

    // Find the pending fund request
    const fundRequest = await Prisma.transaction.findFirst({
      where: {
        externalRefId: razorpay_order_id,
        userId: user.id,
        paymentType: "FUND_REQ_RAZORPAY",
        status: "PENDING",
      },
      include: {
        apiEntity: true,
      },
    });

    if (!fundRequest) {
      throw ApiError.notFound("Order not found or already processed");
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw ApiError.badRequest(
        "Invalid signature, payment verification failed"
      );
    }

    // Update in transaction
    const result = await Prisma.$transaction(async (prisma) => {
      // Update transaction
      const updatedTransaction = await prisma.transaction.update({
        where: { id: fundRequest.id },
        data: {
          referenceId: razorpay_payment_id,
          providerReference: razorpay_payment_id,
          metadata: {
            ...fundRequest.metadata,
            razorpayPaymentId: razorpay_payment_id,
            verifiedAt: new Date().toISOString(),
            signatureVerified: true,
          },
        },
      });

      // Update ApiEntity if exists
      if (fundRequest.apiEntity) {
        await prisma.apiEntity.update({
          where: { id: fundRequest.apiEntity.id },
          data: {
            providerData: {
              ...fundRequest.apiEntity.providerData,
              razorpayPaymentId: razorpay_payment_id,
              signatureVerified: true,
            },
            metadata: {
              ...fundRequest.apiEntity.metadata,
              paymentVerified: true,
              verifiedAt: new Date().toISOString(),
            },
          },
        });
      }

      // Create verification webhook
      await prisma.apiWebhook.create({
        data: {
          transactionId: fundRequest.id,
          apiEntityId: fundRequest.apiEntity?.id,
          provider: "RAZORPAY",
          eventType: "PAYMENT_VERIFIED",
          payload: {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            signature: razorpay_signature,
            verifiedAt: new Date().toISOString(),
          },
          status: "PROCESSED",
          response: {
            success: true,
            message: "Payment verified successfully",
          },
        },
      });

      return updatedTransaction;
    });

    return {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      transactionId: result.id,
      status: "PENDING", // Wait for admin approval
    };
  }

  // Create Razorpay order with ApiEntity
  static async createRazorpayOrder(payload, user) {
    const { amount } = payload;

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      throw ApiError.badRequest("Amount must be greater than zero");
    }

    const options = {
      amount: amountNum * 100, // in paise
      currency: "INR",
      receipt: `wallet_${Date.now()}`,
      notes: { userId: user.id },
    };

    const order = await razorpay.orders.create(options);

    // Get user's primary wallet
    const userWallet = await Prisma.wallet.findFirst({
      where: {
        userId: user.id,
        walletType: "PRIMARY",
      },
    });

    if (!userWallet) {
      throw ApiError.notFound("User wallet not found");
    }

    // Get or create Razorpay service provider
    let service = await Prisma.serviceProvider.findFirst({
      where: { code: "RAZORPAY" },
    });

    if (!service) {
      service = await Prisma.serviceProvider.create({
        data: {
          type: "FUND_REQUEST",
          code: "RAZORPAY",
          name: "Razorpay",
          createdBy: user.id,
          isActive: true,
        },
      });
    }

    // Create ApiEntity for Razorpay order
    const apiEntity = await Prisma.apiEntity.create({
      data: {
        entityType: "razorpay_order",
        entityId: order.id,
        userId: user.id,
        serviceId: service.id,
        provider: "RAZORPAY",
        status: "PENDING",
        providerData: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        },
        metadata: {
          amount: amountNum,
          createdAt: new Date().toISOString(),
        },
        isActive: true,
      },
    });

    // Create pending fund request transaction
    await Prisma.transaction.create({
      data: {
        referenceId: `RZP_${Date.now()}`,
        externalRefId: order.id,
        amount: amountNum,
        netAmount: amountNum,
        currency: "INR",
        status: "PENDING",
        paymentType: "FUND_REQ_RAZORPAY",

        userId: user.id,
        walletId: userWallet.id,
        serviceId: service.id,
        apiEntityId: apiEntity.id,

        requestPayload: {
          provider: "RAZORPAY",
          amount: amountNum,
          razorpayOrder: order,
        },
        metadata: {
          provider: "RAZORPAY",
          razorpayOrderId: order.id,
          apiEntityId: apiEntity.id,
          createdAt: new Date().toISOString(),
        },

        initiatedAt: new Date(),
      },
    });

    // Create initial ledger entry
    await Prisma.ledgerEntry.create({
      data: {
        transactionId: apiEntity.id, // Temporary until transaction is created
        walletId: userWallet.id,
        entryType: "CREDIT",
        referenceType: "TRANSACTION",
        amount: 0,
        runningBalance: Number(userWallet.balance),
        narration: `Razorpay order created - ${order.id}`,
        createdBy: user.id,
        metadata: {
          orderId: order.id,
          expectedAmount: amountNum,
        },
      },
    });

    return {
      id: order.id,
      amount: order.amount / 100,
      currency: order.currency,
      receipt: order.receipt,
      apiEntityId: apiEntity.id,
    };
  }

  // Get wallet balance
  static async getWalletBalance(user) {
    const wallet = await Prisma.wallet.findFirst({
      where: {
        userId: user.id,
        walletType: "PRIMARY",
      },
      select: {
        balance: true,
        availableBalance: true,
        holdBalance: true,
        ledgerEntries: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            entryType: true,
            amount: true,
            narration: true,
            createdAt: true,
          },
        },
      },
    });

    if (!wallet) {
      throw ApiError.notFound("Wallet not found");
    }

    return {
      balance: Number(wallet.balance),
      availableBalance: Number(wallet.availableBalance),
      holdBalance: Number(wallet.holdBalance),
      recentTransactions: wallet.ledgerEntries.map((entry) => ({
        ...entry,
        amount: Number(entry.amount),
      })),
    };
  }

  // Get fund request statistics
  static async getFundRequestStats(user) {
    let userIds = [user.id];

    if (user.role.name === "ADMIN") {
      const childUsers = await Prisma.user.findMany({
        where: { parentId: user.id },
        select: { id: true },
      });
      userIds = childUsers.map((u) => u.id);
    }

    const stats = await Prisma.transaction.groupBy({
      by: ["status"],
      where: {
        userId: { in: userIds },
        paymentType: {
          in: ["FUND_REQ_BANK", "FUND_REQ_RAZORPAY"],
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        amount: true,
      },
    });

    const totalStats = await Prisma.transaction.aggregate({
      where: {
        userId: { in: userIds },
        paymentType: {
          in: ["FUND_REQ_BANK", "FUND_REQ_RAZORPAY"],
        },
      },
      _count: { id: true },
      _sum: { amount: true },
    });

    // Get recent activity from ApiWebhooks
    const recentActivity = await Prisma.apiWebhook.findMany({
      where: {
        transaction: {
          userId: { in: userIds },
          paymentType: {
            in: ["FUND_REQ_BANK", "FUND_REQ_RAZORPAY"],
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        eventType: true,
        status: true,
        createdAt: true,
        transaction: {
          select: {
            amount: true,
            paymentType: true,
          },
        },
      },
    });

    return {
      total: totalStats._count.id,
      totalAmount: Number(totalStats._sum.amount || 0),
      byStatus: stats.map((stat) => ({
        status: stat.status,
        count: stat._count.id,
        amount: Number(stat._sum.amount || 0),
      })),
      recentActivity: recentActivity.map((activity) => ({
        eventType: activity.eventType,
        status: activity.status,
        amount: Number(activity.transaction?.amount || 0),
        paymentType: activity.transaction?.paymentType,
        createdAt: activity.createdAt,
      })),
    };
  }

  // Delete fund request with all relations
  static async deleteFundRequest(id, user) {
    const fundRequest = await Prisma.transaction.findUnique({
      where: { id },
      include: {
        apiEntity: true,
        ledgerEntries: true,
        apiWebhooks: true,
      },
    });

    if (!fundRequest) {
      throw ApiError.notFound("Fund request not found");
    }

    if (
      !["FUND_REQ_BANK", "FUND_REQ_RAZORPAY"].includes(fundRequest.paymentType)
    ) {
      throw ApiError.badRequest("This is not a fund request");
    }

    if (user.role.name !== "ADMIN" && fundRequest.userId !== user.id) {
      throw ApiError.forbidden("Access denied");
    }

    if (fundRequest.status !== "PENDING") {
      throw ApiError.badRequest("Only pending requests can be deleted");
    }

    // Delete in transaction to maintain data integrity
    await Prisma.$transaction(async (prisma) => {
      // Delete related records first
      if (fundRequest.ledgerEntries.length > 0) {
        await prisma.ledgerEntry.deleteMany({
          where: { transactionId: id },
        });
      }

      if (fundRequest.apiWebhooks.length > 0) {
        await prisma.apiWebhook.deleteMany({
          where: { transactionId: id },
        });
      }

      // Delete ApiEntity if exists
      if (fundRequest.apiEntity) {
        await prisma.apiEntity.delete({
          where: { id: fundRequest.apiEntity.id },
        });
      }

      // Finally delete the transaction
      await prisma.transaction.delete({
        where: { id },
      });
    });

    return { message: "Fund request deleted successfully" };
  }

  // Reject and refund topup with webhook creation
  static async rejectAndRefundTopup(id, user) {
    if (user.role.name !== "ADMIN") {
      throw ApiError.forbidden("Only admins can reject and refund topups");
    }

    const fundRequest = await Prisma.transaction.findUnique({
      where: { id },
      include: {
        user: true,
        apiEntity: true,
      },
    });

    if (!fundRequest) {
      throw ApiError.notFound("Fund request not found");
    }

    if (fundRequest.paymentType !== "FUND_REQ_RAZORPAY") {
      throw ApiError.badRequest("Only Razorpay payments can be refunded");
    }

    if (fundRequest.status !== "PENDING") {
      throw ApiError.badRequest("This fund request is already processed");
    }

    // Process refund via Razorpay
    try {
      const refund = await razorpay.payments.refund(fundRequest.referenceId, {
        amount: fundRequest.amount * 100,
        speed: "normal",
      });

      // Update all records in transaction
      const result = await Prisma.$transaction(async (prisma) => {
        // Update transaction status to REFUNDED
        const updatedTransaction = await prisma.transaction.update({
          where: { id },
          data: {
            status: "REFUNDED",
            metadata: {
              ...fundRequest.metadata,
              refundId: refund.id,
              refundedAt: new Date().toISOString(),
              refundedBy: user.id,
            },
          },
        });

        // Update ApiEntity status
        if (fundRequest.apiEntity) {
          await prisma.apiEntity.update({
            where: { id: fundRequest.apiEntity.id },
            data: {
              status: "REJECTED",
              metadata: {
                ...fundRequest.apiEntity.metadata,
                refunded: true,
                refundId: refund.id,
                refundedAt: new Date().toISOString(),
              },
            },
          });
        }

        // Create refund ledger entry
        await prisma.ledgerEntry.create({
          data: {
            transactionId: id,
            walletId: fundRequest.walletId,
            entryType: "DEBIT",
            referenceType: "REFUND",
            amount: 0, // No actual debit since money wasn't added yet
            runningBalance: Number(fundRequest.wallet.balance),
            narration: `Payment refunded - Razorpay Refund ID: ${refund.id}`,
            createdBy: user.id,
            metadata: {
              refundId: refund.id,
              refundAmount: Number(fundRequest.amount),
              refundedBy: user.id,
            },
          },
        });

        // Create refund webhook
        await prisma.apiWebhook.create({
          data: {
            transactionId: id,
            apiEntityId: fundRequest.apiEntity?.id,
            provider: "RAZORPAY",
            eventType: "REFUND_PROCESSED",
            payload: {
              transactionId: id,
              refundId: refund.id,
              amount: refund.amount / 100,
              status: refund.status,
              processedAt: new Date().toISOString(),
            },
            status: "PROCESSED",
          },
        });

        return updatedTransaction;
      });

      return {
        refundId: refund.id,
        status: refund.status,
        amount: refund.amount / 100,
        transactionId: result.id,
      };
    } catch (error) {
      throw ApiError.badRequest(`Refund failed: ${error.message}`);
    }
  }
}

export default FundRequestService;
