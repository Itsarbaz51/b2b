export default class PanPluginInterface {
  constructor(config) {
    if (!config) {
      throw new Error("Plugin config is required");
    }

    this.config = config;
  }

  async verifyPan(_params) {
    throw new Error(`${this.constructor.name} must implement verifyPan()`);
  }
}
