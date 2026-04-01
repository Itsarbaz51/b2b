import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export default class BeneficiaryService {
  // Find verified beneficiary by account
  static async findVerified({ userId, accountNumber, ifsc }) {
    return Prisma.beneficiary.findFirst({
      where: {
        userId,
        accountNumber,
        ifsc,
        isVerified: true,
      },
    });
  }

  // Find by ID (for payout)
  static async findById({ id, userId }) {
    const beneficiary = await Prisma.beneficiary.findFirst({
      where: {
        id,
        userId,
        isVerified: true,
      },
    });

    if (!beneficiary) {
      throw ApiError.badRequest("Invalid or unverified beneficiary");
    }

    return beneficiary;
  }

  // List beneficiary (mobile filter optional)
  static async list({ userId, mobile }) {
    return Prisma.beneficiary.findMany({
      where: {
        userId,
        ...(mobile && { mobile }),
        // isVerified: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // UPSERT (VERIFY SUCCESS ke baad use hoga)
  static async upsertVerified(tx, { userId, payload, response }) {
    return tx.beneficiary.upsert({
      where: {
        userId_accountNumber_ifsc: {
          userId,
          accountNumber: payload.accountNumber,
          ifsc: payload.ifscCode,
        },
      },
      update: {
        name: response.name || payload.name,
        mobile: payload.mobile,
        isVerified: true,
        metaData: response,
      },
      create: {
        userId,
        accountNumber: payload.accountNumber,
        ifsc: payload.ifscCode,
        name: response.name || payload.name,
        mobile: payload.mobile,
        isVerified: true,
        metaData: response,
      },
    });
  }

  // Get or throw (auto mode payout)
  static async getOrThrow({ userId, payload }) {
    console.log(payload);

    const beneficiary = await Prisma.beneficiary.findFirst({
      where: {
        userId,
        accountNumber: payload.accountNumber || payload.accountNo,
        ifsc: payload.ifscCode,
        isVerified: true,
      },
    });

    if (!beneficiary) {
      throw ApiError.badRequest("Please verify bank first");
    }

    return beneficiary;
  }
  static async getOrCreate(tx, { userId, payload }) {
    let beneficiary = await tx.beneficiary.findFirst({
      where: {
        userId,
        accountNumber: payload.accountNo,
        ifsc: payload.ifscCode,
      },
    });

    if (!beneficiary) {
      beneficiary = await tx.beneficiary.create({
        data: {
          userId,
          accountNumber: payload.accountNo,
          ifsc: payload.ifscCode,
          name: payload.beneficiaryName || "Unknown",
          mobile: payload.mobile || payload.number,
          isVerified: false,
        },
      });
    }

    return beneficiary;
  }
}
