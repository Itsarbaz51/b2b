import FundRequestService from "../../services/fundRequest/fundRequest.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/AsyncHandler.js";
import Helper from "../../utils/helper.js";

class FundRequestController {
  static create = asyncHandler(async (req, res) => {
    const payload = {
      ...req.body,
      paymentImage: req.files?.paymentImage?.[0] || null,
    };

    const result = await FundRequestService.create(payload, req.user);

    return res.json(
      ApiResponse.success(
        Helper.serializeBigInt(result),
        "Fund request created"
      )
    );
  });

  static verify = asyncHandler(async (req, res) => {
    const payload = {
      // BANK
      transactionId: req.body?.transactionId,
      action: req.body?.action,
      reason: req.body?.reason,

      // RAZORPAY
      razorpay_payment_id: req.body?.razorpay_payment_id,
      razorpay_order_id: req.body?.razorpay_order_id,
      razorpay_signature: req.body?.razorpay_signature,

      // 🔥 MAIN
      serviceProviderMappingId: req.body.serviceProviderMappingId,
      pricing: req.body.pricing,
      idempotencyKey: req.body.idempotencyKey,
    };

    const result = await FundRequestService.verify(payload, req.user);

    return res.json(
      ApiResponse.success(
        Helper.serializeBigInt(result),
        "Verification success"
      )
    );
  });

  static checkStatus = asyncHandler(async (req, res) => {
    const payload = {
      txnId: req.body.txnId,
      serviceProviderMappingId: req.body.serviceProviderMappingId,
    };

    const result = await FundRequestService.checkStatus(payload, req.user);

    return res.json(
      ApiResponse.success(
        Helper.serializeBigInt(result),
        "Status fetched successfully"
      )
    );
  });
}

export default FundRequestController;
