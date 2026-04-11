import axios from "axios";
import { ApiError } from "../../utils/ApiError.js";
import BbpsInterface from "./bbps.interface.js";

class BbpsPlugin extends BbpsInterface {
  constructor(config) {
    super(config);

    this.client = axios.create({
      baseURL: config.baseURL, // https://api.bulkpe.in/client/bbps
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
    });
  }

  async listCategories() {
    try {
      const { data } = await this.client.post("/listBillCategory");

      if (!data.status) {
        throw ApiError.badRequest(data.message);
      }

      return data.data;
    } catch (err) {
      throw ApiError.internal("List categories failed", err?.message);
    }
  }

  async selectBiller({ biller }) {
    try {
      const { data } = await this.client.post("/selectBiller", {
        biller,
      });

      if (!data.status) {
        throw ApiError.badRequest(data.message);
      }

      return data.data;
    } catch (err) {
      throw ApiError.internal("Select biller failed", err?.message);
    }
  }

  async fetchBill({ billerId, custParam, reference }) {
    try {
      const { data } = await this.client.post("/FetchBillSingle", {
        billerId,
        custParam,
        reference,
      });

      if (!data.status) {
        throw ApiError.badRequest(data.message);
      }

      return data.data;
    } catch (err) {
      throw ApiError.internal("Fetch bill failed", err?.message);
    }
  }

  async payBill({ fetchId, amount, reference }) {
    try {
      const { data } = await this.client.post("/BillPayTxn", {
        fetchId,
        amount,
        reference,
      });

      if (!data.status) {
        throw ApiError.badRequest(data.message);
      }

      return {
        transactionId: data.data.transactionId,
        amount: data.data.amount,
        charge: data.data.charge,
        gst: data.data.gst,
        totalCharge: data.data.totalCharge,
        status: data.data.status,
        raw: data.data,
      };
    } catch (err) {
      throw ApiError.internal("Bill payment failed", err?.message);
    }
  }

  async checkStatus({ transactionId }) {
    try {
      const { data } = await this.client.post("/transactionStatusCheck", {
        transactionId,
      });

      if (!data.status) {
        throw ApiError.badRequest(data.message);
      }

      return {
        status: data.data.status,
        transactionId: data.data.transactionId,
        raw: data.data,
      };
    } catch (err) {
      throw ApiError.internal("Status check failed", err?.message);
    }
  }

  async listTransactions({ page = 1, limit = 50, category, status }) {
    try {
      const { data } = await this.client.post("/listBillTransactions", {
        page,
        limit,
        category,
        status,
      });

      if (!data.status) {
        throw ApiError.badRequest(data.message);
      }

      return data.data;
    } catch (err) {
      throw ApiError.internal("List transactions failed", err?.message);
    }
  }

  async listPendingBills(params) {
    try {
      const { data } = await this.client.get("/listPendingBills", { params });

      if (!data.status) {
        throw ApiError.badRequest(data.message);
      }

      return data.data;
    } catch (err) {
      throw ApiError.internal("Pending bills fetch failed", err?.message);
    }
  }
}

export default BbpsPlugin;
