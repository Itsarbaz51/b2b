import Razorpay from "razorpay";
import crypto from "crypto";
import FundRequestInterface from "./fundRequest.interface.js";
import { ApiError } from "../../utils/ApiError.js";

class RazorpayFundRequestPlugin extends FundRequestInterface {
  constructor(config) {
    super(config);

    this.client = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });
  }

  async createRequest({ amount, userId }) {
    const order = await this.client.orders.create({
      amount: amount,
      currency: "INR",
      receipt: `fund_${Date.now()}`,
      notes: { userId },
    });

    return {
      provider: "RAZORPAY",
      orderId: order.id,
      amount: order.amount / 100,
    };
  }

  async verify({ orderId, paymentId, signature }) {
    const body = orderId + "|" + paymentId;

    const expected = crypto
      .createHmac("sha256", this.config.keySecret)
      .update(body)
      .digest("hex");

    if (expected !== signature) {
      throw ApiError.badRequest("Invalid signature");
    }

    // Razorpay se payment status fetch
    const payment = await this.client.payments.fetch(paymentId);

    return {
      status: payment.status, // captured / authorized / failed
      orderId,
      paymentId,
      raw: payment,
    };
  }
}

export default RazorpayFundRequestPlugin;
