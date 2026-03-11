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
}

export default FundRequestController;
