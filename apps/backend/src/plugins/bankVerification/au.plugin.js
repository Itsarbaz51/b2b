import axios from "axios";
import crypto from "crypto";
import BankVerificationInterface from "./bankVerification.interface.js";
import { ApiError } from "../../utils/ApiError.js";

class AUBankVerificationPlugin extends BankVerificationInterface {
  constructor(config) {
    super(config);

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: 15000,
      headers: {
        "Content-Type": "application/json",
      },
      validateStatus: () => true, // ✅ important (non-200 bhi handle karega)
    });

    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // 🔐 AES-256-GCM
  encrypt(data) {
    const key = Buffer.from(this.config.encryptionKey, "utf8");
    const iv = Buffer.from(this.config.saltKey, "utf8");

    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), "utf8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();
    return Buffer.concat([encrypted, authTag]).toString("base64");
  }

  decrypt(encData) {
    try {
      const key = Buffer.from(this.config.encryptionKey, "utf8");
      const iv = Buffer.from(this.config.saltKey, "utf8");

      const data = Buffer.from(encData, "base64");

      const authTag = data.slice(data.length - 16);
      const encrypted = data.slice(0, data.length - 16);

      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return JSON.parse(decrypted.toString("utf8"));
    } catch (err) {
      throw ApiError.internal("Failed to decrypt AU response");
    }
  }

  // 🔑 TOKEN
  async getAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.get(
        `${this.config.baseUrl}/oauth/accesstoken?grant_type=client_credentials`,
        {
          auth: {
            username: this.config.clientId,
            password: this.config.clientSecret,
          },
          timeout: 10000,
        }
      );

      const data = response.data;

      if (!data?.access_token) {
        throw new Error("Invalid token response");
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

      return this.accessToken;
    } catch (err) {
      throw ApiError.internal("AU OAuth failed");
    }
  }

  // 🔥 MAIN
  async verifyAccount(params) {
    const method = this.config.verificationMethod || "PENNILESS";

    switch (method) {
      case "PENNILESS":
        return this.verifyPenniless(params);

      case "PENNY_DROP":
        return this.verifyPennyDrop(params);

      default:
        throw ApiError.badRequest("Invalid verification method");
    }
  }

  // ✅ PENNILESS
  async verifyPenniless({ accountNo, ifsc, requestId }) {
    try {
      const token = await this.getAccessToken();

      const payload = {
        RemitterAccountNo: this.config.remitterAccount,
        BeneficiaryAccountNo: accountNo,
        BeneficiaryIFSCCode: ifsc,
        RequestId: requestId,
        ReferenceNumber: requestId,
        OriginatingChannel: this.config.channel,
        Remarks: "Account Verification",
        PaymentMethod: "P2A",
        FlgIntraBankAllowed: "N",
        TransactionBranch: this.config.branch,
        RetrievalReferenceNumber: requestId,
      };

      const encrypted = this.encrypt(payload);

      const response = await this.client.post(
        "/CBSIMPSBeneficiaryNameInqService/IMPSBeneficiary",
        { encvalue: encrypted },
        {
          headers: {
            "Key-Authentication": `Bearer ${token}`,
          },
          responseType: "json", // ✅ FIX
        }
      );

      let data = response.data;

      // 🔥 HANDLE STRING RESPONSE
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch {
          throw ApiError.internal("Invalid string response from AU Bank");
        }
      }

      // 🔥 INVALID RESPONSE
      if (!data || typeof data !== "object") {
        throw ApiError.internal("Invalid response from AU Bank");
      }

      // 🔥 ERROR RESPONSE FROM BANK
      if (!data.encvalue) {
        throw ApiError.internal(
          data.message || JSON.stringify(data) || "AU Bank error"
        );
      }

      const decrypted = this.decrypt(data.encvalue);

      if (decrypted?.TransactionStatus?.ResponseCode !== "0") {
        throw ApiError.badRequest(
          decrypted?.TransactionStatus?.ResponseMessage || "Verification failed"
        );
      }

      return {
        status: true,
        statusCode: 200,
        data: {
          account_number: accountNo,
          ifsc,
          name: decrypted.BeneficiaryName,
          valid: true,
          rrn: decrypted.RetrievalReferenceNumber,
          method: "PENNILESS",
        },
      };
    } catch (err) {
      // 🔥 SAFE ERROR HANDLING (NO IncomingMessage CRASH)
      let message = "Penniless verification failed";

      try {
        if (err.response?.data) {
          if (typeof err.response.data === "string") {
            message = err.response.data;
          } else {
            message = JSON.stringify(err.response.data);
          }
        } else if (err.message) {
          message = err.message;
        }
      } catch {
        message = "Unknown error";
      }

      throw ApiError.internal(message);
    }
  }

  async verifyPennyDrop() {
    throw ApiError.internal("Penny Drop not implemented yet");
  }
}

export default AUBankVerificationPlugin;
