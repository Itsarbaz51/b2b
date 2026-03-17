export default class BankVerificationInterface {
  constructor(config) {
    if (!config) {
      throw new Error("Plugin config is required");
    }

    this.config = config;
  }

  async verifyAccount(_params) {
    throw new Error(`${this.constructor.name} must implement verifyAccount()`);
  }
}
