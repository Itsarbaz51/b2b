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

  async createRequest({ amount, userId, notes, receiptId }) {
    const order = await this.client.orders.create({
      amount: Number(amount),
      currency: "INR",
      receipt: receiptId,
      notes: {
        userId: String(userId),
        receipt: String(receiptId),
        actualAmount: notes?.actualAmount
          ? String(notes.actualAmount)
          : undefined,
      },
    });

    return {
      provider: "RAZORPAY",
      orderId: order.id,
      amount: order.amount / 100,
      receipt: order.receipt,
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

  async checkStatus({ paymentId }) {
    if (!paymentId) {
      throw ApiError.badRequest("paymentId is required");
    }

    const payment = await this.client.payments.fetch(paymentId);

    return {
      status: payment.status, // captured / authorized / failed
      paymentId,
      orderId: payment.order_id,
      raw: payment,
    };
  }
}

export default RazorpayFundRequestPlugin;
