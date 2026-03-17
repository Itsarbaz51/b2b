export default class PayoutPluginInterface {
  constructor(config) {
    if (!config) {
      throw new Error("Plugin config is required");
    }

    this.config = config;
  }

  async checkBalance() {
    throw new Error(`${this.constructor.name} must implement checkBalance()`);
  }

  async payout(_params) {
    throw new Error(`${this.constructor.name} must implement payout()`);
  }

  async checkStatus(_params) {
    throw new Error(`${this.constructor.name} must implement checkStatus()`);
  }
}
