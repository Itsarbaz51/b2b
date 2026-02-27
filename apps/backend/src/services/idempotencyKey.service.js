import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";
export class IdempotencyService {
  static async processIdempotencyKey(key, userId) {
    try {
      return await Prisma.$transaction(async (tx) => {
        const existingKey = await tx.idempotencyKey.findUnique({
          where: { key },
        });

        if (existingKey?.used) {
          throw ApiError.badRequest("Request already processed");
        }

        if (existingKey && new Date() > existingKey.expiresAt) {
          await tx.idempotencyKey.delete({ where: { key } });
        }

        const idempotencyKey = await tx.idempotencyKey.upsert({
          where: { key },
          update: {
            used: true,
            userId: userId ?? existingKey?.userId ?? null,
          },
          create: {
            key,
            userId: userId ?? existingKey?.userId ?? null,
            expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
            used: true,
            meta: {
              createdAt: new Date().toISOString(),
              firstUse: true,
            },
          },
        });

        
        return idempotencyKey;
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;

      console.error("Idempotency processing failed", { key, error });
      throw ApiError.internal("Idempotency processing failed");
    }
  }

  static async findExistingResponse(key) {
    try {
      const existingKey = await Prisma.idempotencyKey.findUnique({
        where: { key },
      });

      return existingKey?.used ? existingKey : null;
    } catch (error) {
      console.error("Error finding existing response", { key, error });
      return null;
    }
  }

  static async cleanupExpiredKeys() {
    try {
      const result = await Prisma.idempotencyKey.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      
      return result.count;
    } catch (error) {
      console.error("Failed to cleanup expired keys", { error });
      return 0;
    }
  }
}
