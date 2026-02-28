export default class AadhaarPluginInterface {
  constructor(config) {
    if (!config) {
      throw new Error("Plugin config is required");
    }

    this.config = config;
  }

  async sendOtp(_params) {
    throw new Error(`${this.constructor.name} must implement sendOtp()`);
  }

  async verifyOtp(_params) {
    throw new Error(`${this.constructor.name} must implement verifyOtp()`);
  }
}
