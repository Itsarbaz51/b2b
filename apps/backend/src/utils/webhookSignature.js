import crypto from "crypto";
import { ApiError } from "./ApiError.js";

export function verifyWebhookSignature(provider, payload, headers) {
  if (provider === "RAZORPAY") {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const expected = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(payload))
      .digest("hex");

    if (expected !== headers["x-razorpay-signature"]) {
      throw ApiError.badRequest("Invalid Razorpay signature");
    }
  }

  // Add more providers here
}
