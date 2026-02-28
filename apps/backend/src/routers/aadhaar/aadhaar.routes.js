import { Router } from "express";
import { AadhaarController } from "../../controllers/aadhaar/aadhaar.controller.js";
import { otpLimiter } from "../../middlewares/rateLimiter.middleware.js";
import AuthMiddleware from "../../middlewares/auth.middleware.js";

const aadhaarRoutes = Router();

// Send OTP (Business)
aadhaarRoutes.post(
  "/send-otp",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business"]),
  otpLimiter,
  AadhaarController.sendOtp
);

// Verify OTP (Business)
aadhaarRoutes.post(
  "/verify",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["business"]),
  AadhaarController.verify
);

export default aadhaarRoutes;
