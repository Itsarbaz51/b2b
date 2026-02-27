import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  CommissionEarningService,
  CommissionSettingService,
} from "../services/commission.service.js";
import { ApiError } from "../utils/ApiError.js";

export class CommissionSettingController {
  static createOrUpdate = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized("Unauthorized");

    const setting =
      await CommissionSettingService.createOrUpdateCommissionSetting(
        req.body,
        userId
      );

    return res
      .status(200)
      .json(
        ApiResponse.success(
          setting,
          "Commission setting saved successfully",
          200
        )
      );
  });

  static getByRoleOrUser = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized("Unauthorized");

    const settings =
      await CommissionSettingService.getCommissionSettingsByRoleOrUser(userId);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          settings,
          "Commission settings fetched successfully",
          200
        )
      );
  });

  static getAll = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized("Unauthorized");

    const settings =
      await CommissionSettingService.getCommissionSettingsAll(userId);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          settings,
          "Commission settings fetched successfully",
          200
        )
      );
  });
}

export class CommissionEarningController {
  static create = asyncHandler(async (req, res) => {
    const createdBy = req.user?.id;
    if (!createdBy) throw ApiError.unauthorized("Unauthorized");

    const data = {
      ...req.body,
      createdBy,
    };

    const earning =
      await CommissionEarningService.createCommissionEarning(data);

    return res
      .status(201)
      .json(
        ApiResponse.success(
          earning,
          "Commission earning recorded successfully",
          201
        )
      );
  });

  static getAll = asyncHandler(async (req, res) => {
    const { userId, fromUserId, serviceId, transactionId, startDate, endDate } =
      req.query;

    const filters = {};

    if (typeof userId === "string") filters.userId = userId;
    if (typeof fromUserId === "string") filters.fromUserId = fromUserId;
    if (typeof serviceId === "string") filters.serviceId = serviceId;
    if (typeof transactionId === "string")
      filters.transactionId = transactionId;
    if (typeof startDate === "string") filters.startDate = startDate;
    if (typeof endDate === "string") filters.endDate = endDate;

    const earnings =
      await CommissionEarningService.getCommissionEarnings(filters);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          earnings,
          "Commission earnings fetched successfully",
          200
        )
      );
  });

  static getSummary = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized("Unauthorized");

    const { startDate, endDate } = req.query;

    const period =
      startDate && endDate
        ? {
            startDate: startDate,
            endDate: endDate,
          }
        : undefined;

    const summary = await CommissionEarningService.getCommissionSummary(
      userId,
      period
    );

    return res
      .status(200)
      .json(
        ApiResponse.success(
          summary,
          "Commission summary fetched successfully",
          200
        )
      );
  });
}
