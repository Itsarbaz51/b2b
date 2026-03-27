// plugins/bankVerification/au.plugin.js

import axios from "axios";
import crypto from "crypto";
import { v4 as uuid } from "uuid";
import BankVerificationInterface from "./bankVerification.interface.js";

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

  validateKeys() {
    if (this.config.encryptionKey.length !== 32) {
      throw new Error("Encryption key must be 32 bytes");
    }
    if (this.config.saltKey.length !== 12) {
      throw new Error("IV must be 12 bytes");
    }
  }

  encrypt(data) {
    this.validateKeys();

    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      Buffer.from(this.config.encryptionKey),
      Buffer.from(this.config.saltKey)
    );

    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data)),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([encrypted, authTag]).toString("base64");
  }

  decrypt(encvalue) {
    try {
      const data = Buffer.from(encvalue, "base64");

      const encrypted = data.slice(0, -16);
      const authTag = data.slice(-16);

      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        Buffer.from(this.config.encryptionKey),
        Buffer.from(this.config.saltKey)
      );

      decipher.setAuthTag(authTag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return JSON.parse(decrypted.toString());
    } catch {
      return null;
    }
  }

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

    this.accessToken = res.data.access_token;
    this.tokenExpiry = Date.now() + (parseInt(res.data.expires_in) - 60) * 1000;

    return this.accessToken;
  }

  async verifyAccount(params) {
    const method = this.config.verificationMethod;

    switch (method) {
      case "PENNILESS":
        return this.verifyPenniless(params);

      case "PENNY_DROP":
        return this.verifyPennyDrop(params);

      default:
        throw new Error("Invalid verification method");
    }
  }

  async verifyPenniless({ accountNo, ifsc }) {
    const token = await this.getToken();
    const requestId = uuid();

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

    const encvalue = this.encrypt(payload);

    const res = await this.client.post(
      "/CBSIMPSBeneficiaryNameInqService/IMPSBeneficiary",
      { encvalue },
      {
        headers: { "Key-Authentication": `Bearer ${token}` },
        responseType: "text",
      }
    );

    const parsed = JSON.parse(res.data);
    const decrypted = this.decrypt(parsed.encvalue);

    if (!decrypted || decrypted.TransactionStatus.ResponseCode !== "0") {
      return {
        status: false,
        message:
          decrypted?.TransactionStatus?.ResponseMessage ||
          "Verification failed",
      };
    }

    return {
      status: true,
      name: decrypted.BeneficiaryName,
      rrn: decrypted.RetrievalReferenceNumber,
    };
  }

  async verifyPennyDrop() {
    throw new Error("Penny drop not implemented yet");
  }
}

export default AUBankVerificationPlugin;
