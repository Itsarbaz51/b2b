import Prisma from "../../db/db.js";
import WalletEngine from "../../engines/wallet.engine.js";
import LedgerEngine from "../../engines/ledger.engine.js";
import ServicePermissionResolver from "../../resolvers/servicePermission.resolver.js";
import ApiEntityService from "../apiEntity.service.js";
import TransactionService from "../transaction.service.js";
import { getAadhaarPlugin } from "../../plugin_registry/aadhaar/pluginRegistry.js";
import { ApiError } from "../../utils/ApiError.js";
import ProviderResolver from "../../resolvers/Provider.resolver.js";
import SurchargeEngine from "../../engines/surcharge.engine.js";

export default class AadhaarService {
  // STEP 1 — SEND OTP
  static async sendOtp(payload, actor) {
    const { aadhaarNumber, serviceId, idempotencyKey } = payload;
    const userId = actor.id;

    await TransactionService.checkDuplicate(idempotencyKey);

    await ServicePermissionResolver.validateHierarchyServiceAccess(
      userId,
      serviceId
    );

    const { provider, serviceProviderMapping } =
      await ProviderResolver.resolveProvider(serviceId);

    await CommissionSettingService.checkUserPricingRule(
      userId,
      serviceProviderMapping.id
    );

    const plugin = getAadhaarPlugin(
      provider.code,
      serviceProviderMapping.config
    );

    return await Prisma.$transaction(async (tx) => {
      const wallet = await WalletEngine.getWallet({
        tx,
        userId,
        walletType: "PRIMARY",
      });

      if (serviceProviderMapping?.pricingValueType !== "FLAT") {
        throw ApiError.badRequest("Aadhaar service supports only FLAT pricing");
      }

      const providerCost = BigInt(serviceProviderMapping.providerCost);

      const surcharge = await SurchargeEngine.calculate(tx, {
        userId,
        serviceProviderMappingId: serviceProviderMapping.id,
        amount: providerCost,
      });

      const finalAmount = providerCost + surcharge;

      // HOLD WALLET
      await WalletEngine.hold(tx, wallet, finalAmount);

      const pricing = {
        providerCost,
        surcharge,
        total: finalAmount,
      };

      const { transaction, apiEntity } = await TransactionService.create(tx, {
        userId,
        walletId: wallet.id,
        serviceProviderMappingId: serviceProviderMapping.id,
        amount: finalAmount,
        pricing,
        idempotencyKey,
        requestPayload: payload,
      });

      let providerResponse;

      try {
        providerResponse = {
          status: true,
          statusCode: 200,
          data: {
            ref_id: "71598161",
            status: "SUCCESS",
          },
        };

        providerResponse = await plugin.sendOtp({ aadhaarNumber });

        await ApiEntityService.updateProviderInit(tx, {
          apiEntityId: apiEntity.id,
          providerResponse,
        });

        return {
          transactionId: transaction.id,
          referenceId: providerResponse?.data?.ref_id,
        };
      } catch (error) {
        await WalletEngine.releaseHold(tx, wallet, finalAmount);

        await tx.transaction.update({
          where: { id: transaction.id },
          data: { status: "FAILED" },
        });

        throw error;
      }
    });
  }

  //  STEP 2 — VERIFY OTP
  static async verifyOtp(payload, actor) {
    const { transactionId, referenceId, otp } = payload;

    return await Prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.findUnique({
        where: { id: transactionId },
        include: {
          serviceProviderMapping: {
            include: { provider: true },
          },
          apiEntity: true,
        },
      });

      if (!transaction) throw ApiError.notFound("Transaction not found");

      if (transaction.status !== "PENDING")
        throw ApiError.badRequest("Invalid transaction state");

      const plugin = getAadhaarPlugin(
        transaction.serviceProviderMapping.provider.code,
        transaction.serviceProviderMapping.config
      );

      const wallet = await WalletEngine.getWallet({
        tx,
        userId: transaction.userId,
        walletType: "PRIMARY",
      });

      let providerResponse = {
        status: true,
        statusCode: 200,
        data: {
          ref_id: "71464459",
          status: "VALID",
          care_of: "Sultan Ahmed",
          address:
            "26, Jagannathpuri, Boaring road, Jhotwara, Jaipur, Jhotwara, Rajasthan, India, 302012",
          dob: "03-08-2003",
          email: "",
          gender: "M",
          name: "Sohail Ahmed Maniyar",
          split_address: {
            country: "India",
            dist: "Jaipur",
            house: "26",
            landmark: "",
            pincode: "302012",
            po: "Jhotwara",
            state: "Rajasthan",
            street: "Jagannathpuri",
            subdist: "",
            vtc: "Jhotwara",
            locality: "Boaring road",
          },
          year_of_birth: "2003",
          mobile_hash:
            "70f10ef40e228029f40bd7cee26407e918a7c99da64a0098e0bbc20120655d3e",
          photo_link:
            "data:image/png;base64,data:image/png;base64,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",
          share_code: "2345",
          xml_file: "",
        },
        message: "",
      };
      // let providerResponse;

      try {
        providerResponse = {
          status: true,
          data: {
            ref_id: referenceId,
            status: "VALID",
          },
        };

        providerResponse = await plugin.verifyOtp({ referenceId, otp });

        if (!providerResponse?.status) {
          throw ApiError.badRequest("OTP verification failed");
        }

        // 1️⃣ CAPTURE HOLD
        await WalletEngine.captureHold(tx, wallet, transaction.amount);

        // 2️⃣ WALLET LEDGER ENTRY
        await LedgerEngine.create(tx, {
          walletId: wallet.id,
          transactionId,
          entryType: "DEBIT",
          referenceType: "TRANSACTION",
          serviceProviderMappingId: transaction.serviceProviderMappingId,
          amount: transaction.amount,
          narration: "Aadhaar Verification Charge",
          createdBy: actor.id,
        });

        // 3️⃣ SURCHARGE DISTRIBUTION
        await SurchargeEngine.distribute(tx, {
          transactionId: transaction.id,
          userId: transaction.userId,
          serviceProviderMappingId: transaction.serviceProviderMappingId,
          amount: transaction.amount, // IMPORTANT
          createdBy: actor.id,
        });

        // 4️⃣ UPDATE TRANSACTION
        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "SUCCESS",
          providerReference: referenceId,
          providerResponse: {
            ...providerResponse,
            name: providerResponse?.data?.name || null,
          },
        });

        return providerResponse.data;
      } catch (error) {
        // RELEASE HOLD
        await WalletEngine.releaseHold(tx, wallet, transaction.amount);

        await TransactionService.update(tx, {
          transactionId: transaction.id,
          status: "FAILED",
          providerReference: referenceId,
          providerResponse: error?.message,
        });

        throw error;
      }
    });
  }
}
