import axios from "axios";
import PanPluginInterface from "./pan.interface.js";
import { ApiError } from "../../utils/ApiError.js";

class BulkpePanPlugin extends PanPluginInterface {
  constructor(config) {
    super(config);

    this.client = axios.create({
      baseURL: this.config.bulkpeBaseUrl,
      timeout: 15000,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }

  async verifyPan({ panNumber }) {
    try {
      const response = await this.client.post("/verifyPanLite", {
        pan: panNumber,
      });

      if (!response.data.status) {
        throw ApiError.badRequest(
          response.data.message || "PAN verification failed"
        );
      }

      return response;
    } catch (err) {
      throw ApiError.internal(
        err.response?.data?.message || "PAN verification failed"
      );
    }
  }
}

export default BulkpePanPlugin;
