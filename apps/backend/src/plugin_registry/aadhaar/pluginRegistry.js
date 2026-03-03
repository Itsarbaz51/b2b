import { ApiError } from "../../utils/ApiError.js";
import BulkpeAadhaarPlugin from "../../plugins/aadhaar/bulkpe.plugin.js";

export function getAadhaarPlugin(providerCode, config) {
  switch (providerCode) {
    case "BULKPE":
      return new BulkpeAadhaarPlugin(config);

    default:
      throw ApiError.internal("Unknown Aadhaar provider");
  }
}
