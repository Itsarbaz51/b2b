import { ApiError } from "../../utils/ApiError.js";

class FundRequestInterface {
  constructor(config) {
    this.config = config;
  }

  async createRequest(payload) {
    throw ApiError.internal("createRequest not implemented");
  }

  async verify(payload) {
    throw ApiError.internal("verify not implemented");
  }
}

export default FundRequestInterface;
