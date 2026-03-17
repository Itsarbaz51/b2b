import PayoutService from "../../services/payout/payout.service.js";
import asyncHandler from "../../utils/AsyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";

export default class PayoutController {
  static checkBalance = asyncHandler(async (req, res) => {
    const result = await PayoutService.checkBalance(req.body, req.user);

    return res
      .status(200)
      .json(ApiResponse.success(result, "Balance fetched", 200));
  });

  static transfer = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError("User not authenticated", 401);
    }

    const result = await PayoutService.transfer(req.body, req.user);

    return res
      .status(200)
      .json(ApiResponse.success(result, "Payout initiated successfully", 200));
  });

  static checkStatus = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new ApiError("User not authenticated", 401);
    }

    const result = await PayoutService.checkStatus(req.body, req.user);

    return res
      .status(200)
      .json(ApiResponse.success(result, "Payout status fetched", 200));
  });
}
