import axios from "axios";
import PayoutPluginInterface from "./payout.interface.js";
import { ApiError } from "../../utils/ApiError.js";

class WonderpayPayoutPlugin extends PayoutPluginInterface {
  constructor(config) {
    super(config);

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // BALANCE CHECK
  async checkBalance() {
    try {
      const { data } = await this.client.post(
        "/api/api/api-module/payout/balance",
        {
          clientId: this.config.clientId,
          secretKey: this.config.secretKey,
        }
      );

      if (data.statusCode !== 1) {
        throw ApiError.badRequest(data.message || "Balance fetch failed");
      }

      return data.balance;
    } catch (err) {
      throw ApiError.internal(
        err.response?.data?.message || "Wonderpay balance API failed"
      );
    }
  }

  // PAYOUT
  async payout({
    number,
    amount,
    transferMode,
    accountNo,
    ifscCode,
    beneficiaryName,
    vpa = "",
    clientOrderId,
  }) {
    try {
      const { data } = await this.client.post(
        "/api/api/api-module/payout/payout",
        {
          clientId: this.config.clientId,
          secretKey: this.config.secretKey,
          number,
          amount,
          transferMode,
          accountNo,
          ifscCode,
          beneficiaryName,
          vpa,
          clientOrderId,
        }
      );
      console.log(data);

      if (data.statusCode !== 1) {
        throw ApiError.badRequest(data.message || "Payout failed");
      }

      return data;
    } catch (err) {
      throw ApiError.internal(
        err.response?.data?.message ||
          err.response?.data?.errors ||
          err.message ||
          "Wonderpay payout failed"
      );
    }
  }

  // STATUS CHECK
  async checkStatus({ clientOrderId }) {
    try {
      const { data } = await this.client.post(
        "/api/api/api-module/payout/status-check",
        {
          clientId: this.config.clientId,
          secretKey: this.config.secretKey,
          clientOrderId,
        }
      );

      return data;
    } catch (err) {
      throw ApiError.internal(
        err.response?.data?.message || "Wonderpay status check failed"
      );
    }
  }
}

export default WonderpayPayoutPlugin;
