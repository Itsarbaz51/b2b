import axios from "axios";
import BaseProvider from "./base.provider.js";

export default class BulkpeProvider extends BaseProvider {
  constructor(config) {
    super();
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async verifyAadhaar({ aadhaarNumber, mobile }) {
    const res = await axios.post(
      `${this.baseUrl}/aadhaar/verify`,
      { aadhaar_number: aadhaarNumber, mobile },
      { headers: { Authorization: `Bearer ${this.apiKey}` } }
    );

    return res.data;
  }

  async verifyPan({ panNumber }) {
    const res = await axios.post(
      `${this.baseUrl}/pan/verify`,
      { pan_number: panNumber },
      { headers: { Authorization: `Bearer ${this.apiKey}` } }
    );

    return res.data;
  }
}
