import axios from "axios";
import crypto from "crypto";
import BankVerificationInterface from "./bankVerification.interface.js";
import { ApiError } from "../../utils/ApiError.js";

class AUBankVerificationPlugin extends BankVerificationInterface {
  constructor(config) {
    super(config);

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 15000,
      headers: { "Content-Type": "application/json" },
      validateStatus: () => true,
    });

    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // 🔥 KEY + IV PARSE
  getCryptoConfig() {
    const key = Buffer.from(this.config.encryptionKey, "base64");
    const iv = Buffer.from(this.config.saltKey, "base64");

    console.log("KEY LENGTH:", key.length);
    console.log("IV LENGTH:", iv.length);

    if (iv.length !== 16) {
      throw ApiError.internal(`Invalid IV length: ${iv.length}`);
    }

    let algorithm;

    if (key.length === 16) {
      algorithm = "aes-128-cbc";
    } else if (key.length === 24) {
      algorithm = "aes-192-cbc";
    } else if (key.length === 32) {
      algorithm = "aes-256-cbc";
    } else {
      throw ApiError.internal(`Unsupported key length: ${key.length}`);
    }

    console.log("USING ALGO:", algorithm);

    return { key, iv, algorithm };
  }

  // 🔐 ENCRYPT
  encrypt(data) {
    try {
      const { key, iv, algorithm } = this.getCryptoConfig();

      const cipher = crypto.createCipheriv(algorithm, key, iv);

      let encrypted = cipher.update(JSON.stringify(data), "utf8", "base64");
      encrypted += cipher.final("base64");

      return encrypted;
    } catch (err) {
      console.log("❌ ENCRYPT ERROR:", err.message);
      throw ApiError.internal(err.message);
    }
  }

  // 🔓 DECRYPT
  decrypt(encvalue) {
    try {
      const { key, iv, algorithm } = this.getCryptoConfig();

      const decipher = crypto.createDecipheriv(algorithm, key, iv);

      let decrypted = decipher.update(encvalue, "base64", "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted);
    } catch (err) {
      console.log("❌ DECRYPT ERROR:", err.message);
      return null;
    }
  }

  // 🔑 TOKEN
  async getToken() {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const res = await axios.get(
      `${this.config.baseUrl}/oauth/accesstoken?grant_type=client_credentials`,
      {
        auth: {
          username: this.config.clientId,
          password: this.config.clientSecret,
        },
      }
    );

    if (!res.data?.access_token) {
      throw ApiError.internal("Token generation failed");
    }

    this.accessToken = res.data.access_token;
    this.tokenExpiry = Date.now() + (parseInt(res.data.expires_in) - 60) * 1000;

    return this.accessToken;
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
  async verifyPenniless({ accountNo, ifscCode, requestId }) {
    const token = await this.getToken();

    const payload = {
      RemitterAccountNo: this.config.remitterAccount,
      BeneficiaryAccountNo: accountNo,
      BeneficiaryIFSCCode: ifscCode,
      RequestId: requestId,
      ReferenceNumber: requestId,
      OriginatingChannel: this.config.channel,
      Remarks: "Account Verification",
      PaymentMethod: "P2A",
      FlgIntraBankAllowed: "N",
      TransactionBranch: this.config.branch,
      RetrievalReferenceNumber: requestId,
    };

    console.log("📤 ORIGINAL PAYLOAD:", payload);

    const encvalue = this.encrypt(payload);

    console.log("🔐 ENCRYPTED:", encvalue);

    const res = await this.client.post(
      "/CBSIMPSBeneficiaryNameInqService/IMPSBeneficiary",
      { encvalue },
      {
        headers: {
          "Key-Authentication": `Bearer ${token}`,
        },
        responseType: "text",
      }
    );

    console.log("📥 RAW RESPONSE:", res.data);

    let parsed;
    try {
      parsed = JSON.parse(res.data);
    } catch {
      throw ApiError.internal("Invalid JSON response from AU");
    }

    if (!parsed.encvalue) {
      throw ApiError.internal("Missing encvalue in AU response");
    }

    const decrypted = this.decrypt(parsed.encvalue);

    console.log("🔓 DECRYPTED:", decrypted);

    if (!decrypted || decrypted.TransactionStatus?.ResponseCode !== "0") {
      return {
        status: false,
        message:
          decrypted?.TransactionStatus?.ResponseMessage ||
          "Verification failed",
        raw: decrypted,
      };
    }

    return {
      status: true,
      data: {
        name: decrypted.BeneficiaryName,
        rrn: decrypted.RetrievalReferenceNumber,
        accountNo,
        ifscCode,
      },
    };
  }

  async verifyPennyDrop() {
    throw ApiError.internal("Penny drop not implemented yet");
  }
}

export default AUBankVerificationPlugin;
