import Prisma from "../../db/db.js";
import { getBbpsPlugin } from "../../plugin_registry/bbps/pluginRegistry.js";
import WalletEngine from "../../engines/wallet.engine.js";
import TransactionService from "../transaction.service.js";
import LedgerEngine from "../../engines/ledger.engine.js";
import { ApiError } from "../../utils/ApiError.js";
import Helper from "../../utils/helper.js";
import { CryptoService } from "../../utils/cryptoService.js";

export default class BulkpeBbpsService {
  // COMMON CONFIG
  static getPlugin(serviceProviderMapping) {
    let parsedConfig = {};

    try {
      parsedConfig =
        typeof serviceProviderMapping.config === "string"
          ? JSON.parse(CryptoService.decrypt(serviceProviderMapping.config))
          : serviceProviderMapping.config;
    } catch (err) {
      throw ApiError.internal("Invalid provider config", err?.message);
    }

    return getBbpsPlugin("BULKPE", parsedConfig);
  }

  // ---------------- LIST CATEGORIES ----------------
  static async listCategories(serviceProviderMapping) {
    // const plugin = this.getPlugin(serviceProviderMapping);
    return {
      status: true,
      statusCode: 200,
      data: [
        {
          biller: "Clubs and Associations",
          category: "Other Services",
        },
        {
          biller: "Life Insurance",
          category: "Financial Services",
        },
        {
          biller: "Water",
          category: "Utility Bill payments",
        },
        {
          biller: "Electricity",
          category: "Utility Bill payments",
        },
        {
          biller: "Municipal Services",
          category: "Other Services",
        },
        {
          biller: "Mobile Prepaid",
          category: "Recharge & Bill Payments",
        },
        {
          biller: "Housing Society",
          category: "Other Services",
        },
        {
          biller: "Municipal Taxes",
          category: "Financial Services",
        },
        {
          biller: "Broadband Postpaid",
          category: "Recharge & Bill Payments",
        },
        {
          biller: "Landline Postpaid",
          category: "Recharge & Bill Payments",
        },
        {
          biller: "Recurring Deposit",
          category: "Financial Services",
        },
        {
          biller: "Subscription",
          category: "Other Service",
        },
        {
          biller: "Gas",
          category: "Utility Bill payments",
        },
        {
          biller: "Cable TV",
          category: "Recharge & Bill Payments",
        },
        {
          biller: "Mobile Postpaid",
          category: "Recharge & Bill Payments",
        },
        {
          biller: "LPG Gas",
          category: "Utility Bill payments",
        },
        {
          biller: "Education Fees",
          category: "Utility Bill payments",
        },
        {
          biller: "Loan Repayment",
          category: "Financial Services",
        },
        {
          biller: "Fastag",
          category: "Recharge & Bill Payments",
        },
        {
          biller: "Credit Card",
          category: "Financial Services",
        },
        {
          biller: "DTH",
          category: "Recharge & Bill Payments",
        },
        {
          biller: "Hospital and Pathology",
          category: "Other Services",
        },
      ],
      message: "Data fetched!",
      count: 22,
    };
  }

  // ---------------- SELECT BILLER ----------------
  static async selectBiller(payload, serviceProviderMapping) {
    const plugin = this.getPlugin(serviceProviderMapping);
    return plugin.selectBiller({ biller: payload.biller });
  }

  // ---------------- FETCH BILL ----------------
  static async fetchBill(payload, serviceProviderMapping) {
    const plugin = this.getPlugin(serviceProviderMapping);

    const bill = await plugin.fetchBill(payload);

    // OPTIONAL: DB save (audit purpose)
    await Prisma.bbpsFetch.create({
      data: {
        userId: payload.userId || null,
        billerId: payload.billerId,
        amount: bill.amount,
        fetchId: bill.fetchId,
        raw: bill,
      },
    });

    return bill;
  }

  // ---------------- PAY BILL ----------------
  static async payBill(payload, actor, serviceProviderMapping) {
    const plugin = this.getPlugin(serviceProviderMapping);

    const billAmount = BigInt(payload.amount);

    return Prisma.$transaction(async (tx) => {
      const wallet = await WalletEngine.getWallet({
        tx,
        userId: actor.id,
        walletType: "PRIMARY",
      });

      if (wallet.balance < billAmount) {
        throw ApiError.badRequest("Insufficient balance");
      }

      const txnId = Helper.generateTxnId("BBPS");

      const { transaction } = await TransactionService.create(tx, {
        txnId,
        userId: actor.id,
        walletId: wallet.id,
        serviceProviderMappingId: serviceProviderMapping.id,
        amount: billAmount,
        requestPayload: payload,
      });

      // 💸 DEBIT
      await WalletEngine.debit(tx, wallet, billAmount);

      await LedgerEngine.create(tx, {
        walletId: wallet.id,
        transactionId: transaction.id,
        entryType: "DEBIT",
        referenceType: "BBPS",
        serviceProviderMappingId: serviceProviderMapping.id,
        amount: billAmount,
        narration: "BBPS bill payment",
        createdBy: actor.id,
      });

      //  API CALL
      const response = await plugin.payBill({
        fetchId: payload.fetchId,
        amount: payload.amount.toString(),
        reference: txnId,
      });

      await TransactionService.update(tx, {
        transactionId: transaction.id,
        status: response.status === "SUCCESS" ? "SUCCESS" : "PENDING",
        providerReference: response.transactionId,
        providerResponse: response,
      });

      return {
        transactionId: transaction.id,
        providerTxnId: response.transactionId,
        amount: response.amount,
        charge: response.charge,
        gst: response.gst,
        totalCharge: response.totalCharge,
        status: response.status,
      };
    });
  }

  // ---------------- CHECK STATUS ----------------
  static async checkStatus(payload, serviceProviderMapping) {
    const plugin = this.getPlugin(serviceProviderMapping);

    return Prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { id: payload.transactionId },
      });

      if (!transaction) {
        throw ApiError.notFound("Transaction not found");
      }

      if (["SUCCESS", "FAILED"].includes(transaction.status)) {
        return {
          status: transaction.status,
          message: "Already processed",
        };
      }

      const response = await plugin.checkStatus({
        transactionId: transaction.providerReference,
      });

      let finalStatus = "PENDING";

      if (response.status === "SUCCESS") finalStatus = "SUCCESS";
      else if (response.status === "FAILED") finalStatus = "FAILED";

      await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: finalStatus,
          providerResponse: response,
          completedAt: finalStatus !== "PENDING" ? new Date() : null,
        },
      });

      return {
        transactionId: transaction.id,
        status: finalStatus,
        providerResponse: response,
      };
    });
  }

  // ---------------- LIST TRANSACTIONS ----------------
  static async listTransactions(payload, serviceProviderMapping) {
    const plugin = this.getPlugin(serviceProviderMapping);
    return plugin.listTransactions(payload);
  }

  // ---------------- PENDING BILLS ----------------
  static async listPendingBills(payload, serviceProviderMapping) {
    const plugin = this.getPlugin(serviceProviderMapping);
    return plugin.listPendingBills(payload);
  }
}
