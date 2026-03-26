import { ApiError } from "../../utils/ApiError.js";

export default class PanPluginInterface {
  constructor(config) {
    if (!config) {
      throw ApiError.internal("Plugin config is required");
    }

    this.config = config;
  }

  async verifyPan(_params) {
    throw ApiError.internal(`${this.constructor.name} must implement verifyPan()`);
  }
}
