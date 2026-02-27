import FundRequestService from "../../services/fundRequest/fundRequest.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/AsyncHandler.js";

class FundRequestController {
  // Get all fund requests (for admin) or user's own requests
  static index = asyncHandler(async (req, res) => {
    const result = await FundRequestService.listFundRequests(
      req.body,
      req.user
    );
    return res
      .status(200)
      .json(ApiResponse.success(200, "Fund requests fetched successfully"));
  });

  // Get single fund request details
  static show = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await FundRequestService.getFundRequestById(id, req.user);
    return res
      .status(200)
      .json(ApiResponse.success(result, "Fund request fetched successfully"));
  });

  // Create  fund request
  static store = asyncHandler(async (req, res) => {
    const result = await FundRequestService.createFundRequest(
      req.body,
      req.user,
      req.files
    );
    return res
      .status(201)
      .json(ApiResponse.success(result, "Fund request created successfully"));
  });

  // Update fund request status (admin only)
  static update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await FundRequestService.updateFundRequestStatus(
      id,
      req.body,
      req.user
    );
    return res
      .status(200)
      .json(ApiResponse.success(result, "Fund request updated successfully"));
  });

  // Verify Razorpay payment
  static verification = asyncHandler(async (req, res) => {
    const result = await FundRequestService.verifyRazorpayPayment(
      req.body,
      req.user
    );
    return res
      .status(200)
      .json(ApiResponse.success(result, "Payment verified successfully"));
  });

  // Delete fund request
  static destroy = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await FundRequestService.deleteFundRequest(id, req.user);
    return res
      .status(200)
      .json(ApiResponse.success(result, "Fund request deleted successfully"));
  });

  // Get wallet balance
  static getWalletBalance = asyncHandler(async (req, res) => {
    const result = await FundRequestService.getWalletBalance(req.user);
    return res
      .status(200)
      .json(
        ApiResponse.success(
          result,
          "Wallet balance fetched successfully",
          result
        )
      );
  });

  // Create Razorpay order
  static createRazorpayOrder = asyncHandler(async (req, res) => {
    const result = await FundRequestService.createRazorpayOrder(
      req.body,
      req.user
    );
    return res
      .status(200)
      .json(ApiResponse.success(result, "Order created successfully"));
  });

  // Get fund request statistics
  static getStats = asyncHandler(async (req, res) => {
    const result = await FundRequestService.getFundRequestStats(req.user);
    return res
      .status(200)
      .json(ApiResponse.success(result, "Statistics fetched successfully"));
  });

  // Reject and refund topup (admin only)
  static rejectTopup = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await FundRequestService.rejectAndRefundTopup(id, req.user);
    return res
      .status(200)
      .json(
        ApiResponse.success(result, "Topup rejected and refunded successfully")
      );
  });
}

export default FundRequestController;
