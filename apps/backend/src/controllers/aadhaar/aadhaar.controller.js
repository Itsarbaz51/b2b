import asyncHandler from "../../utils/AsyncHandler.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import AadhaarService from "../../services/aadhaar/aadhaar.service.js";

class AadhaarController {
  static sendOtp = asyncHandler(async (req, res) => {
    const result = await AadhaarService.sendOtp(req.body, req.user);

    if (!result) {
      throw ApiError.internal("Failed to send OTP");
    }

    res
      .status(201)
      .json(ApiResponse.success(result, "OTP sent successfully", 201));
  });

  static verify = asyncHandler(async (req, res) => {
    const result = await AadhaarService.verify(req.body, req.user);

    if (!result) {
      throw ApiError.internal("Verification failed");
    }

    res
      .status(200)
      .json(ApiResponse.success(result, "KYC verified successfully", 200));
  });
}

export { AadhaarController };
