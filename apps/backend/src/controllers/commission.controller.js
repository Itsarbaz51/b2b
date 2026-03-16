import asyncHandler from "../utils/AsyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import CommissionEarningService, {
  CommissionSettingService,
  CommissionSlabService,
} from "../services/commission.service.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";

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
  static getEarnings = asyncHandler(async (req, res) => {
    const filters = { ...req.query };

    const role = req.user?.role;
    const roleType = req.user?.roleType;

    // Normal user → only own
    if (role !== "ADMIN" && roleType !== "employee") {
      filters.userId = req.user.id;
    }

    const earnings =
      await CommissionEarningService.getCommissionEarnings(filters);

    return res
      .status(200)
      .json(
        ApiResponse.success(
          earnings,
          "Commission earnings fetched successfully"
        )
      );
  });

  static getSummary = asyncHandler(async (req, res) => {
    const roleName = req.user?.role;
    const roleType = req.user?.roleType;

    // Admin + Employee → all data
    const userId =
      roleName === "ADMIN" || roleType === "employee" ? null : req.user.id;

    const summary = await CommissionEarningService.getCommissionSummary(userId);

    return res.json(ApiResponse.success(summary, "Commission summary fetched"));
  });
}

export class CommissionSlabController {
  static upsert = asyncHandler(async (req, res) => {
    const slab = await CommissionSlabService.upsert(req.body);

    return res
      .status(200)
      .json(
        ApiResponse.success(Helper.serializeBigInt(slab), "Commission slab operation successful", 200)
      );
  });
}
