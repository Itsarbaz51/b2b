import AUBankVerificationPlugin from "../../plugins/bankVerification/au.plugin.js";
import { ApiError } from "../../utils/ApiError.js";

export function getBankVerificationPlugin(providerCode, config) {
  switch (providerCode) {
    case "AU":
      return new AUBankVerificationPlugin(config);

    default:
      throw ApiError.internal("Unknown BANK VERIFICATION provider");
  }
}
