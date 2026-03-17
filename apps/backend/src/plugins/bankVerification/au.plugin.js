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
    });

    this.accessToken = null;
    this.tokenExpiry = null;
  }

  encrypt(data) {
    const key = Buffer.from(this.config.encryptionKey, "utf8");
    const iv = Buffer.from(this.config.saltKey, "utf8");

    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

    let encrypted = cipher.update(JSON.stringify(data), "utf8", "base64");
    encrypted += cipher.final("base64");

    const authTag = cipher.getAuthTag().toString("base64");

    return encrypted + ":" + authTag;
  }

  decrypt(encData) {
    const [encrypted, authTag] = encData.split(":");

    const key = Buffer.from(this.config.encryptionKey, "utf8");
    const iv = Buffer.from(this.config.saltKey, "utf8");

    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(Buffer.from(authTag, "base64"));

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
  }

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

  async verifyAccount(params) {
    const method = this.config.verificationMethod;

    switch (method) {
      case "PENNILESS":
        return this.verifyPenniless(params);

      case "PENNY_DROP":
        return this.verifyPennyDrop(params);

      default:
        throw ApiError.badRequest("Invalid verification method");
    }
  }

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

      const { data } = await this.client.post(
        "/CBSIMPSBeneficiaryNameInqService/IMPSBeneficiary",
        { encvalue: encrypted },
        {
          headers: {
            Authentication: `Bearer ${token}`,
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
