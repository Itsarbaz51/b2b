import { ApiError } from "../../utils/ApiError.js";
import RazorpayFundRequestPlugin from "../../plugins/fundRequest/razorpay.plugin.js";
import BankFundRequestPlugin from "../../plugins/fundRequest/bank.plugin.js";

export function getFundRequestPlugin(providerCode, config) {
  switch (providerCode) {
    case "RAZORPAY":
      return new RazorpayFundRequestPlugin(config);

    case "BANK_TRANSFER":
      return new BankFundRequestPlugin(config);

    default:
      throw ApiError.internal("Unknown Fund Request provider");
  }
}
