import Prisma from "../../db/db.js";
import { getBbpsPlugin } from "../../plugin_registry/bbps/pluginRegistry.js";
import WalletEngine from "../../engines/wallet.engine.js";
import TransactionService from "../transaction.service.js";
import LedgerEngine from "../../engines/ledger.engine.js";
import { ApiError } from "../../utils/ApiError.js";
import Helper from "../../utils/helper.js";
import { CryptoService } from "../../utils/cryptoService.js";
import { isExpired } from "../../utils/time.js";
import CommissionSettlementEngine from "../../engines/commission-settlement.engine.js";

// ---------------- IMAGE MAPPING ----------------
const categoryImages = {
  "Broadband Postpaid": "broadBand.png",
  "Cable TV": "cableTV.png",
  "Clubs and Associations": "clubAndAssociation.png",
  "Credit Card": "Creditcard.png",
  DTH: "dthSateliteIcon.png",
  "Education Fees": "educationFees.png",
  Electricity: "electricity.png",
  Fastag: "fastTag.png",
  Gas: "gasCylinder.png",
  "Hospital and Pathology": "hospital.png",
  "Housing Society": "houseSociety.png",
  "Landline Postpaid": "landLine.png",
  "Life Insurance": "lifeInsurance.png",
  "Loan Repayment": "loanRepayment.png",
  "Mobile Prepaid": "mobilePrepaid.png",
  "Mobile Postpaid": "mobilePrepaid.png",
  "Municipal Taxes": "municipalTax.png",
  "Municipal Services": "municipalTax.png",
  "LPG Gas": "pipedGas.png",
  "Recurring Deposit": "recurringDeposit.png",
  Water: "waterBill.png",
};

// ---------------- HELPER ----------------
function generateRoute(name) {
  return `/bbps/${name.toLowerCase().replace(/ /g, "-")}`;
}

function formatCategories(data) {
  const categoryMap = {};

  data.forEach((item) => {
    let categoryName = item.category;

    if (categoryName === "Utility Bill payments") {
      categoryName = "Utility Bill Payments";
    }

    if (categoryName === "Other Service") {
      categoryName = "Other Services";
    }

    if (!categoryMap[categoryName]) {
      categoryMap[categoryName] = {
        category: categoryName,
        services: [],
      };
    }

    categoryMap[categoryName].services.push({
      name: item.biller,
      route: generateRoute(item.biller),
      image: `http://localhost:8000/uploads/categories/${
        categoryImages[item.biller] || "default.jpg"
      }`,
    });
  });

  const sortedCategories = Object.values(categoryMap).sort((a, b) =>
    a.category === "Recharge & Bill Payments" ? -1 : 1
  );

  return {
    data: sortedCategories,
    count: data.length,
  };
}

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
    const cache = await Prisma.bbpsCategory.findMany();

    if (cache.length && !isExpired(cache[0].updatedAt)) {
      return formatCategories(cache);
    }

    const plugin = this.getPlugin(serviceProviderMapping);
    const response = await plugin.listCategories();

    await Prisma.bbpsCategory.deleteMany();

    await Prisma.bbpsCategory.createMany({
      data: response.map((item) => ({
        biller: item.biller,
        category: item.category,
      })),
    });

    return formatCategories(response);
  }

  // ---------------- SELECT BILLER ----------------
  static async selectBiller(payload, serviceProviderMapping) {
    const cache = await Prisma.bbpsBiller.findMany({
      where: { category: payload.biller },
    });

    if (cache.length && !isExpired(cache[0].updatedAt)) {
      return cache;
    }

    const plugin = this.getPlugin(serviceProviderMapping);
    const res = await plugin.selectBiller({ biller: payload.biller });

    // 🔥 UPSERT
    await Promise.all(
      res.map((b) =>
        Prisma.bbpsBiller.upsert({
          where: { billerId: b.billerId },
          update: {
            billerName: b.billerName,
            category: b.category,
            customerParams: b.customerparams,
          },
          create: {
            billerId: b.billerId,
            billerName: b.billerName,
            category: b.category,
            customerParams: b.customerparams,
          },
        })
      )
    );

    return res;
  }

  static async fetchBill(payload, serviceProviderMapping, actor) {
    const reference = Helper.generateTxnId("BBPS");

    const sortedParams = [...payload.custParam].sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    const customerParamsKey = JSON.stringify(sortedParams);

    const existing = await Prisma.bbpsFetchBill.findFirst({
      where: {
        userId: actor.id,
        billerId: payload.billerId,
        customerParamsKey: customerParamsKey,
      },
    });

    if (existing) {
      return existing.rawResponse?.data;
    }

    const plugin = this.getPlugin(serviceProviderMapping);

    const bill = await plugin.fetchBill({
      ...payload,
      reference,
    });

    const created = await Prisma.bbpsFetchBill.create({
      data: {
        userId: actor.id,
        serviceProviderMappingId: payload.serviceProviderMappingId,

        customerParams: payload.custParam,
        customerParamsKey: customerParamsKey,

        billerId: payload.billerId,
        reference,
        fetchId: bill?.data.fetchId,

        amount: BigInt(bill?.data.amount),
        status: bill?.data.status,

        customerName: bill?.data.billDetails?.customerName || null,
        dueDate: bill?.data.billDetails?.dueDate
          ? new Date(bill?.data.billDetails.dueDate)
          : null,

        rawResponse: bill,
      },
    });

    return created?.rawResponse?.data;
  }

  // ---------------- PAY BILL ----------------
  static async payBill(
    payload,
    actor,
    serviceProviderMapping,
    service,
    provider
  ) {
    const plugin = this.getPlugin(serviceProviderMapping);
    const billAmount = BigInt(payload.amount);

    const bbpsFetchBill = Prisma.bbpsFetchBill.findFirst({
      where: {
        fetchId: payload.fetchId,
      },
    });

    return Prisma.$transaction(async (tx) => {
      const txnId = Helper.generateTxnId("BBPS");

      const { transaction, wallet, pricing, isDuplicate } =
        await CommissionSettlementEngine.execute({
          tx,
          actor,
          payload: {
            ...payload,
            txnId,
            amount: billAmount,
          },
          serviceProviderMapping,
        });

      if (isDuplicate) {
        return {
          transactionId: transaction.id,
          status: transaction.status,
        };
      }

      if (["SUCCESS", "FAILED"].includes(transaction.status)) {
        return {
          transactionId: transaction.id,
          status: transaction.status,
        };
      }

      let response;

      try {
        response = await plugin.payBill({
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

        if (response.status === "SUCCESS") {
          await CommissionSettlementEngine.success({
            tx,
            actor,
            transaction,
            wallet,
            pricing,
            serviceProviderMapping,
            service,
            provider,
            category: bbpsFetchBill?.rawResponse?.data?.category,
          });
        }

        if (response.status === "FAILED") {
          await CommissionSettlementEngine.failed({
            tx,
            wallet,
            pricing,
          });
        }

        return {
          transactionId: transaction.id,
          providerTxnId: response.transactionId,
          status: response.status,
        };
      } catch (err) {
        // ❌ API ERROR → RELEASE HOLD
        await CommissionSettlementEngine.failed({
          tx,
          wallet,
          pricing,
        });

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "FAILED",
          providerResponse: err.message,
        });

        throw err;
      }
    });
  }

  // ---------------- CHECK STATUS ----------------
  static async checkStatus(payload, serviceProviderMapping, service, provider) {
    const plugin = this.getPlugin(serviceProviderMapping);

    return Prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findFirst({
        where: { id: payload.transactionId },
      });

      if (!transaction) {
        throw ApiError.notFound("Transaction not found");
      }

      // ✅ Already success → skip
      if (transaction.status === "SUCCESS") {
        return {
          status: "SUCCESS",
          message: "Already success",
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

      const wallet = await WalletEngine.getWallet({
        tx,
        userId: transaction.userId,
        walletType: "PRIMARY",
      });

      // ✅ SUCCESS → CAPTURE + COMMISSION
      if (finalStatus === "SUCCESS") {
        await CommissionSettlementEngine.success({
          tx,
          actor: { id: transaction.userId },
          transaction,
          wallet,
          pricing: transaction.pricing,
          serviceProviderMapping,
          service,
          provider,
        });
      }

      // ❌ FAILED → RELEASE
      if (finalStatus === "FAILED") {
        await CommissionSettlementEngine.failed({
          tx,
          wallet,
          pricing: transaction.pricing,
        });
      }

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
