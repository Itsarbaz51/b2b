import crypto from "crypto";
import { ApiError } from "../../utils/ApiError.js";

export default class ApiEntityService {
  // 1️⃣ Create ApiEntity
  static async create(
    tx,
    {
      userId,
      serviceId,
      entityType,
      provider = "BULKPE",
      metadata = {},
      reference = null,
    }
  ) {
    if (!userId || !entityType)
      throw ApiError.badRequest("userId & entityType required");

    return await tx.apiEntity.create({
      data: {
        entityType,
        entityId: crypto.randomUUID(),
        reference,
        userId,
        serviceId,
        provider,
        status: "PENDING",
        metadata,
      },
    });
  }

  // 2️⃣ Update Status
  static async updateStatus(
    tx,
    { apiEntityId, status, providerData, verificationData }
  ) {
    if (!apiEntityId) throw ApiError.badRequest("apiEntityId required");

    return await tx.apiEntity.update({
      where: { id: apiEntityId },
      data: {
        status,
        providerData,
        verificationData,
        verifiedAt: status === "ACTIVE" ? new Date() : null,
      },
    });
  }

  // 3️⃣ Attach Provider Reference
  static async attachProviderReference(tx, { apiEntityId, providerReference }) {
    return await tx.apiEntity.update({
      where: { id: apiEntityId },
      data: {
        reference: providerReference,
      },
    });
  }

  // 4️⃣ Get Entity
  static async getById(apiEntityId) {
    return await Prisma.apiEntity.findUnique({
      where: { id: apiEntityId },
    });
  }
}
