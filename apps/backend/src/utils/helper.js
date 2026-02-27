import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";
import axios from "axios";
import crypto from "crypto";
import fs from "fs";

class Helper {
  static generateAccessToken(payload) {
    const secret = process.env.ACCESS_TOKEN_SECRET;
    const options = {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      jwtid: uuidv4(),
    };
    return jwt.sign(payload, secret, options);
  }

  static generateRefreshToken(payload) {
    const secret = process.env.REFRESH_TOKEN_SECRET;
    const options = {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      jwtid: uuidv4(),
    };
    return jwt.sign(payload, secret, options);
  }

  static verifyRefreshToken(token) {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  }

  static serializeUser(user) {
    if (!user) return user;

    const serialized = { ...user };

    if (user.wallets) {
      serialized.wallets = user.wallets.map((wallet) => ({
        ...wallet,
        // Convert BigInt balances to rupees
        balance: this.convertBigIntToRupees(wallet.balance),
        holdBalance: this.convertBigIntToRupees(wallet.holdBalance),
        availableBalance: this.convertBigIntToRupees(wallet.availableBalance),
        dailyLimit: this.convertBigIntToRupees(wallet.dailyLimit),
        monthlyLimit: this.convertBigIntToRupees(wallet.monthlyLimit),
        perTransactionLimit: this.convertBigIntToRupees(
          wallet.perTransactionLimit
        ),
      }));
    }

    if (user.bankInfo?.primaryAccount) {
      serialized.bankInfo.primaryAccount = {
        ...user.bankInfo.primaryAccount,
      };
    }

    if (user.kycInfo?.latestKyc?.dob) {
      serialized.kycInfo.latestKyc.dob =
        user.kycInfo.latestKyc.dob.toISOString();
    }

    if (user.kycInfo?.latestKyc?.createdAt) {
      serialized.kycInfo.latestKyc.createdAt =
        user.kycInfo.latestKyc.createdAt.toISOString();
    }

    if (user.kycInfo?.latestKyc?.updatedAt) {
      serialized.kycInfo.latestKyc.updatedAt =
        user.kycInfo.latestKyc.updatedAt.toISOString();
    }

    return serialized;
  }

  static convertBigIntToRupees(value) {
    if (!value) return "0.00";

    const bigIntValue = BigInt(value);
    const rupees = bigIntValue / 100n;
    const paise = bigIntValue % 100n;

    return `${rupees}.${paise.toString().padStart(2, "0")}`;
  }

  static serializeCommission(data) {
    if (Array.isArray(data)) {
      return data.map((item) => this.serializeCommissionItem(item));
    }
    return this.serializeCommissionItem(data);
  }

  static serializeCommissionItem(item) {
    if (!item) return item;

    const serialized = { ...item };

    const bigIntFields = [
      "amount",
      "commissionAmount",
      "tdsAmount",
      "gstAmount",
      "surchargeAmount",
      "netAmount",
      "minAmount",
      "maxAmount",
      "balance",
      "holdBalance",
      "availableBalance",
    ];

    bigIntFields.forEach((field) => {
      if (serialized[field] !== undefined && serialized[field] !== null) {
        serialized[field] = Number(serialized[field]);
      }
    });

    // Convert Decimal to Number
    const decimalFields = [
      "commissionValue",
      "tdsPercent",
      "gstPercent",
      "surchargeAmount",
    ];
    decimalFields.forEach((field) => {
      if (serialized[field] !== undefined && serialized[field] !== null) {
        serialized[field] = Number(serialized[field]);
      }
    });

    return serialized;
  }

  static async sendEmail({ to, subject, text, html }) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    return transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to,
      subject,
      text,
      html,
    });
  }

  static getClientIP(req) {
    const forwarded = req.headers["x-forwarded-for"];

    let ip;

    if (typeof forwarded === "string") {
      ip = forwarded?.split(",")[0]?.trim();
    } else if (Array.isArray(forwarded)) {
      ip = forwarded[0]?.trim();
    } else if (req.socket?.remoteAddress) {
      ip = req.socket.remoteAddress;
    } else {
      ip = "";
    }

    if (
      !ip ||
      ip.startsWith("127.") ||
      ip === "::1" ||
      ip.startsWith("192.168.") ||
      ip.startsWith("10.")
    ) {
      return "";
    }

    return ip;
  }

  static async reverseGeocode(lat, lon) {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`,
        { timeout: 5000 }
      );

      const data = response.data;
      if (data.address) {
        const address = data.display_name;
        return { address };
      }
    } catch (error) {
      console.error("Reverse geocoding failed:", error.message);
      throw error;
    }

    return { address: `${lat}, ${lon}` };
  }

  static hashData(data) {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  static deleteOldImage(oldImagePath) {
    if (fs.existsSync(oldImagePath)) {
      try {
        fs.unlinkSync(oldImagePath);
        console.log("Local image deleted successfully::", oldImagePath);
      } catch (err) {
        console.log("Error deleting local image:", err.message);
      }
    } else {
      console.log("No local image to delete at:", oldImagePath);
    }
  }

  static generatePassword(length = 12) {
    if (length < 4) {
      throw new Error("Password length must be at least 4 characters.");
    }

    const charset =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*";

    let password = "";

    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));

    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    const passwordArray = password.split("");
    for (let i = passwordArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [passwordArray[i], passwordArray[j]] = [
        passwordArray[j],
        passwordArray[i],
      ];
    }

    const shuffledPassword = passwordArray.join("");

    return shuffledPassword;
  }

  static generateTransactionPin(length = 4) {
    if (length < 1) {
      throw new Error("PIN length must be at least 1 digit.");
    }

    const numbers = "0123456789";
    let pin = "";

    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const randomValues = new Uint32Array(length);
      crypto.getRandomValues(randomValues);
      for (let i = 0; i < length; i++) {
        pin += numbers.charAt(randomValues[i] % numbers.length);
      }
    } else {
      for (let i = 0; i < length; i++) {
        pin += numbers.charAt(Math.floor(Math.random() * numbers.length));
      }
    }

    return pin;
  }

  static generateCommonMetadata(req, res, duration = null) {
    const metadata = {
      // Request details
      method: req.method,
      url: req.originalUrl,

      // Response details
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,

      // Performance
      ...(duration && { durationMs: duration.toFixed(2) }),

      // Request data
      ...(Object.keys(req.params).length > 0 && { params: req.params }),
      ...(Object.keys(req.query).length > 0 && { query: req.query }),
    };

    if (req.headers["user-agent"]) {
      metadata.userAgent = {
        raw: req.headers["user-agent"].substring(0, 200),
        browser: this.extractBrowserInfo(req.headers["user-agent"]),
        device: this.extractDeviceInfo(req.headers["user-agent"]),
      };
    }

    return metadata;
  }

  static extractBrowserInfo(userAgent) {
    const browserInfo = {};

    // More comprehensive browser detection
    const browserPatterns = [
      { pattern: /Chrome\/(\d+\.\d+)/, name: "Chrome" },
      { pattern: /Firefox\/(\d+\.\d+)/, name: "Firefox" },
      { pattern: /Safari\/(\d+\.\d+)/, name: "Safari" },
      { pattern: /Edg\/(\d+\.\d+)/, name: "Edge" },
      { pattern: /OPR\/(\d+\.\d+)/, name: "Opera" },
    ];

    for (const { pattern, name } of browserPatterns) {
      const match = userAgent.match(pattern);
      if (match) {
        browserInfo.name = name;
        browserInfo.version = match[1];
        break;
      }
    }

    return Object.keys(browserInfo).length > 0 ? browserInfo : undefined;
  }

  static extractDeviceInfo(userAgent) {
    const deviceInfo = {};

    // Enhanced device detection
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      deviceInfo.type = /Tablet|iPad/.test(userAgent) ? "Tablet" : "Mobile";
    } else {
      deviceInfo.type = "Desktop";
    }

    // OS detection
    const osPatterns = [
      { pattern: /Android (\d+\.\d+)/, os: "Android", version: true },
      { pattern: /iPhone OS (\d+_\d+)/, os: "iOS", version: true },
      { pattern: /Windows NT (\d+\.\d+)/, os: "Windows", version: true },
      { pattern: /Mac OS X (\d+[._]\d+)/, os: "macOS", version: true },
      { pattern: /Linux/, os: "Linux", version: false },
    ];

    for (const { pattern, os, version } of osPatterns) {
      const match = userAgent.match(pattern);
      if (match) {
        deviceInfo.os = os;
        if (version) {
          deviceInfo.osVersion = match[1].replace(/_/g, ".");
        }
        break;
      }
    }

    return Object.keys(deviceInfo).length > 0 ? deviceInfo : undefined;
  }
}

export default Helper;
