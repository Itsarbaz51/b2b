import { ApiError } from "../../utils/ApiError.js";

export default class BankVerificationInterface {
  constructor(config) {
    if (!config) {
      throw ApiError.internal("Plugin config is required");
    }
    this.config = config;
  }

  async verifyAccount(_params) {
    throw ApiError.internal(
      `${this.constructor.name} must implement verifyAccount()`
    );
  }
}
