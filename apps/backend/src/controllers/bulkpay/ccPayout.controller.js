import CCPayoutService from "../../services/bulkpay/ccPayout.service.js";
import asyncHandler from "../../utils/AsyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

export class CCPayoutController {
  constructor() {
    this.payoutService = new CCPayoutService();
  }

  createSender = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const reqIp = req.ip;

    if (!userId) {
      throw ApiError.internal("Failed to get user ID in createSender");
    }

    const result = await this.payoutService.createSender(
      userId,
      reqIp,
      req.body
    );

    res
      .status(201)
      .json(ApiResponse.success(result, "Sender created successfully", 201));
  });

  uploadCardImage = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { senderId, cardImageType } = req.body;

    if (!userId) {
      throw ApiError.internal("Failed to get user ID in uploadCardImage");
    }

    if (!req.file) {
      throw ApiError.badRequest("Card image file is required");
    }

    const result = await this.payoutService.uploadCardImage(
      userId,
      senderId,
      cardImageType,
      req.file
    );

    res
      .status(201)
      .json(
        ApiResponse.success(result, "Card image uploaded successfully", 201)
      );
  });

  listSenders = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.internal("Failed to get user ID in listSenders");
    }

    const result = await this.payoutService.listSenders(userId, req.query);

    res
      .status(200)
      .json(ApiResponse.success(result, "Senders retrieved successfully", 200));
  });

  createBeneficiary = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.internal("Failed to get user ID in createBeneficiary");
    }

    const result = await this.payoutService.createBeneficiary(userId, req.body);

    res
      .status(201)
      .json(
        ApiResponse.success(result, "Beneficiary created successfully", 201)
      );
  });

  listBeneficiaries = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.internal("Failed to get user ID in listBeneficiaries");
    }

    const result = await this.payoutService.listBeneficiaries(
      userId,
      req.query
    );

    res
      .status(200)
      .json(
        ApiResponse.success(result, "Beneficiaries retrieved successfully", 200)
      );
  });

  createCollection = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.internal("Failed to get user ID in createCollection");
    }

    const result = await this.payoutService.createCardCollection(
      userId,
      req.body
    );

    res
      .status(201)
      .json(
        ApiResponse.success(result, "Card collection created successfully", 201)
      );
  });

  listCollections = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.internal("Failed to get user ID in listCollections");
    }

    const result = await this.payoutService.listCollections(userId, req.query);

    res
      .status(200)
      .json(
        ApiResponse.success(result, "Collections retrieved successfully", 200)
      );
  });

  webhookHandler = asyncHandler(async (req, res) => {
    const result = await this.payoutService.handleWebhook(req.body);

    res
      .status(200)
      .json(ApiResponse.success(result, "Webhook handled successfully", 200));
  });

  getDashboard = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.internal("Failed to get user ID in getDashboard");
    }

    const result = await this.payoutService.getDashboardStats(userId);

    res
      .status(200)
      .json(
        ApiResponse.success(result, "Dashboard data fetched successfully", 200)
      );
  });
}

export default CCPayoutController;