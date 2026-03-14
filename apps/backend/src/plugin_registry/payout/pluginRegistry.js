import WonderpayPayoutPlugin from "../../plugins/payout/wonderpay.plugin.js";
import { ApiError } from "../../utils/ApiError.js";

export function getPanPlugin(providerCode, config) {
  switch (providerCode) {
    case "WONDERPAY":
      return new WonderpayPayoutPlugin(config);

    default:
      throw ApiError.internal("Unknown PAYOUT provider");
  }
}
