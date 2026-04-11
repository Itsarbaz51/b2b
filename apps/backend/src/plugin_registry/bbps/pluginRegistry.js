import { ApiError } from "../../utils/ApiError.js";
import BbpsPlugin from "../../plugins/bbps/bulkpe.plugin.js";

export function getBbpsPlugin(providerCode, config) {
  switch (providerCode) {
    case "BULKPE":
      return new BbpsPlugin(config);

    default:
      throw ApiError.internal("Unknown BBPS provider");
  }
}
