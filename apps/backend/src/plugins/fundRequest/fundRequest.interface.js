class FundRequestInterface {
  constructor(config) {
    this.config = config;
  }

  async createRequest(payload) {
    throw new Error("createRequest not implemented");
  }

  async verify(payload) {
    throw new Error("verify not implemented");
  }
}

export default FundRequestInterface;
