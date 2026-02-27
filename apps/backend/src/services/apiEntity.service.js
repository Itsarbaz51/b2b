import Prisma from "../db/db.js";
import axios from "axios";

export default class ApiEntityService {
  static async callProvider({ providerName, url, method = "POST", payload }) {
    const start = Date.now();

    try {
      const response = await axios({
        method,
        url,
        data: payload,
      });

      await Prisma.apiLog.create({
        data: {
          providerName,
          request: payload,
          response: response.data,
          latency: Date.now() - start,
          status: "SUCCESS",
        },
      });

      return response.data;
    } catch (error) {
      await Prisma.apiLog.create({
        data: {
          providerName,
          request: payload,
          response: error.response?.data || error.message,
          latency: Date.now() - start,
          status: "FAILED",
        },
      });

      throw error;
    }
  }
}
