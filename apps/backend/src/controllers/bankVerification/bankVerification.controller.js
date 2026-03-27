import asyncHandler from "../../utils/AsyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import BankVerificationService from "../../services/bankVerification/bankVerification.service.js";

export default class BankVerificationController {
  static verify = asyncHandler(async (req, res) => {
    const result = await BankVerificationService.verifyAccount(
      req.body,
      req.user
    );

    res
      .status(200)
      .json(ApiResponse.success(result, "Account verified successfully"));
  });
}
