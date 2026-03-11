import FundRequestInterface from "./fundRequest.interface.js";

class BankFundRequestPlugin extends FundRequestInterface {
  async createRequest(payload) {
    const { amount, rrn, transactionDate } = payload;

    return {
      status: "PENDING",
      provider: "BANK_TRANSFER",
      providerReference: rrn,
      amount,
      transactionDate,
    };
  }
}

export default BankFundRequestPlugin;
