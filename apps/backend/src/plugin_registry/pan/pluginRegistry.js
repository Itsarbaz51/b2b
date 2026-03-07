import { ApiError } from "../../utils/ApiError.js";
import BulkpePanPlugin from "../../plugins/pan/bulkpe.plugin.js";

export function getPanPlugin(providerCode, config) {
  switch (providerCode) {
    case "BULKPE":
      return new BulkpePanPlugin(config);

    default:
      throw ApiError.internal("Unknown PAN provider");
  }
}
