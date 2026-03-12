import FundRequestService from "../../services/fundRequest/fundRequest.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/AsyncHandler.js";

class FundRequestController {
  static create = asyncHandler(async (req, res) => {
    const payload = {
      ...req.body,
      paymentImage: req.files?.paymentImage?.[0] || null,
    };

    const result = await FundRequestService.create(payload, req.user);

    return res.json(ApiResponse.success(result, "Fund request created"));
  });

  static verify = asyncHandler(async (req, res) => {
    const payload = {
      transactionId: req.params.transactionId,
      action: req.body.action,
      reason: req.body.reason,
    };

    const result = await FundRequestService.verify(payload, req.user);

    return res.json(ApiResponse.success(result, `${payload?.action} success`));
  });
}

export default FundRequestController;
