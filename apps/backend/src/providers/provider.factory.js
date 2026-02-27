import BulkpeProvider from "./bulkpe.provider.js";
import InstalncPayProvider from "./instalncpay.provider.js";

export default class ProviderFactory {
  static getProvider(provider, config) {
    switch (provider) {
      case "BULKPE":
        return new BulkpeProvider(config);

      case "INSTALNCPAY":
        return new InstalncPayProvider(config);

      default:
        throw new Error("Unsupported provider");
    }
  }
}
