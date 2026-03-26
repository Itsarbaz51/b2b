import { ApiError } from "../../utils/ApiError.js";

export default class AadhaarPluginInterface {
  constructor(config) {
    if (!config) {
      throw ApiError.internal("Plugin config is required");
    }

    this.config = config;
  }

  async sendOtp(_params) {
    throw new ApiError.internal(
      `${this.constructor.name} must implement sendOtp()`
    );
  }

  async verifyOtp(_params) {
    throw new ApiError.internal(
      `${this.constructor.name} must implement verifyOtp()`
    );
  }
}
