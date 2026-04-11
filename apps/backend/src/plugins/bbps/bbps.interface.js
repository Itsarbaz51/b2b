import { ApiError } from "../../utils/ApiError.js";

class BbpsInterface {
  constructor(config) {
    this.config = config;
  }

  async listCategories() {
    throw ApiError.internal("listCategories not implemented");
  }

  async selectBiller(payload) {
    throw ApiError.internal("selectBiller not implemented");
  }

  async fetchBill(payload) {
    throw ApiError.internal("fetchBill not implemented");
  }

  async payBill(payload) {
    throw ApiError.internal("payBill not implemented");
  }

  async checkStatus(payload) {
    throw ApiError.internal("checkStatus not implemented");
  }

  async listTransactions(payload) {
    throw ApiError.internal("listTransactions not implemented");
  }

  async listPendingBills(payload) {
    throw ApiError.internal("listPendingBills not implemented");
  }
}

export default BbpsInterface;
