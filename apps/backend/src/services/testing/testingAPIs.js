import axios from "axios";
import { ApiError } from "../../utils/ApiError.js";

export class TestingAPI {
  static async razorpay({ apiKey, apiSecret }) {
    try {
      const response = await axios.get(
        "https://api.razorpay.com/v1/payments?count=1",
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${apiKey}:${apiSecret}`).toString("base64")}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      throw ApiError.badRequest(
        `Oops! ${
          error?.response
            ? error?.response?.data.error.description
            : error?.message
        } — please verify your API key and try again.”`
      );
    }
  }
}
