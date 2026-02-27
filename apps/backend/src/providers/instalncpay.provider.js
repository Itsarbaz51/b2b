import axios from "axios";
import BaseProvider from "./base.provider.js";

export default class InstalncPayProvider extends BaseProvider {
  constructor(config) {
    super();
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async verifyPan({ panNumber }) {
    const res = await axios.post(
      `${this.baseUrl}/pan/verify`,
      { pan_number: panNumber },
      { headers: { "x-api-key": this.apiKey } }
    );

    return res.data;
  }
}
