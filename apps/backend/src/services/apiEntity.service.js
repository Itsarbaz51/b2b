import crypto from "crypto";
import { ApiError } from "../utils/ApiError.js";

export default class ApiEntityService {
  // CREATE
  static async create(
    tx,
    {
      userId,
      serviceProviderMappingId,
      requestPayload,
      reference = null,
      providerInitData,
    }
  ) {
    if (!userId) throw ApiError.badRequest("userId required");

    return await tx.apiEntity.create({
      data: {
        reference: reference || crypto.randomUUID(),
        userId,
        serviceProviderMappingId,
        providerInitData,
        requestPayload,
        status: "PENDING",
      },
    });
  }

  // UPDATE PROVIDER INIT (OTP sent etc.)
  static async updateProviderInit(tx, { apiEntityId, providerResponse }) {
    if (!apiEntityId) throw ApiError.badRequest("apiEntityId required");

    return await tx.apiEntity.update({
      where: { id: apiEntityId },
      data: {
        reference: providerResponse?.data?.ref_id,
        providerInitData: providerResponse,
        status: providerResponse?.data?.status,
        errorData:
          providerResponse?.data?.status !== "SUCCESS"
            ? providerResponse?.data
            : null,
      },
    });
  }

  // SUCCESS UPDATE (Final response)
  static async markSuccess(tx, { apiEntityId, providerResponse }) {
    if (!apiEntityId) throw ApiError.badRequest("apiEntityId required");

    return await tx.apiEntity.update({
      where: { id: apiEntityId },
      data: {
        providerFinalData: providerResponse,
        status: "SUCCESS",
        completedAt: new Date(),
      },
    });
  }

  // FAIL UPDATE
  static async markFailed(tx, { apiEntityId, errorData }) {
    if (!apiEntityId) throw ApiError.badRequest("apiEntityId required");

    return await tx.apiEntity.update({
      where: { id: apiEntityId },
      data: {
        errorData,
        status: "FAILED",
        completedAt: new Date(),
      },
    });
  }

  // GENERIC STATUS UPDATE
  static async updateStatus(tx, { apiEntityId, status }) {
    if (!apiEntityId) throw ApiError.badRequest("apiEntityId required");

    return await tx.apiEntity.update({
      where: { id: apiEntityId },
      data: {
        status,
      },
    });
  }

  // GET BY ID
  static async getById(apiEntityId) {
    if (!apiEntityId) throw ApiError.badRequest("apiEntityId required");

    return await Prisma.apiEntity.findUnique({
      where: { id: apiEntityId },
      include: {
        serviceProviderMapping: true,
        transaction: true,
      },
    });
  }
}
