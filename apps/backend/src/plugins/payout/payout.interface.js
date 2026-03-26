import { ApiError } from "../../utils/ApiError.js";

export default class PayoutPluginInterface {
  constructor(config) {
    if (!config) {
      throw ApiError.internal("Plugin config is required");
    }

    this.config = config;
  }

  async checkBalance() {
    throw ApiError.internal(
      `${this.constructor.name} must implement checkBalance()`
    );
  }

  async payout(_params) {
    throw ApiError.internal(`${this.constructor.name} must implement payout()`);
  }

  async checkStatus(_params) {
    throw ApiError.internal(
      `${this.constructor.name} must implement checkStatus()`
    );
  }
}
