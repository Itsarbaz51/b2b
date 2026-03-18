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
    });

    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // 🔐 AES-256-GCM (AU COMPATIBLE)
  encrypt(data) {
    const key = Buffer.from(this.config.encryptionKey, "utf8");
    const iv = Buffer.from(this.config.saltKey, "utf8");

    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), "utf8"),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    const finalBuffer = Buffer.concat([encrypted, authTag]);

    return finalBuffer.toString("base64");
  }

  decrypt(encData) {
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
  }

  // 🔑 TOKEN (with caching)
  async getAccessToken() {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const { data } = await axios.get(
        `${this.config.baseUrl}/oauth/accesstoken?grant_type=client_credentials`,
        {
          auth: {
            username: this.config.clientId,
            password: this.config.clientSecret,
          },
        }
      );

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

      return this.accessToken;
    } catch (err) {
      throw ApiError.internal("AU OAuth failed");
    }
  }

  // 🔥 MAIN ENTRY
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

  // ✅ PENNILESS API
  async verifyPenniless({ accountNo, ifsc, requestId }) {
    try {
      const token = await this.getAccessToken();

      const payload = {
        RemitterAccountNo: this.config.remitterAccount,
        BeneficiaryAccountNo: accountNo,
        BeneficiaryIFSCCode: ifsc,
        RequestId: requestId,
        ReferenceNumber: requestId,
        OriginatingChannel: this.config.channel, // 🔥 YAHI USE HO RAHA
        Remarks: "Account Verification",
        PaymentMethod: "P2A",
        FlgIntraBankAllowed: "N",
        TransactionBranch: this.config.branch,
        RetrievalReferenceNumber: requestId,
      };

      const encrypted = this.encrypt(payload);

      const { data } = await this.client.post(
        "/CBSIMPSBeneficiaryNameInqService/IMPSBeneficiary",
        { encvalue: encrypted },
        {
          headers: {
            "Key-Authentication": `Bearer ${token}`, // 🔥 FIXED HEADER
          },
        }
      );

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
      throw ApiError.internal(
        err.response?.data || err.message || "Penniless failed"
      );
    }
  }

  async verifyPennyDrop() {
    throw new Error("Penny Drop not implemented yet");
  }
}

export default AUBankVerificationPlugin;
