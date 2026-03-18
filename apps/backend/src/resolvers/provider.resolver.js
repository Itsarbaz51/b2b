import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export default class ProviderResolver {
  static async resolveByMappingId(mappingId) {
    if (!mappingId) {
      throw ApiError.badRequest("MappingId required");
    }

    const mapping = await Prisma.serviceProviderMapping.findUnique({
      where: { id: mappingId },
      include: {
        provider: true,
        service: true,
      },
    });

    if (!mapping) {
      throw ApiError.notFound("Service Provider Mapping not found");
    }

    if (!mapping.isActive) {
      throw ApiError.forbidden("Mapping is inactive");
    }

    if (!mapping.provider || !mapping.provider.isActive) {
      throw ApiError.forbidden("Provider is inactive");
    }

    if (!mapping.service || !mapping.service.isActive) {
      throw ApiError.forbidden("Service is inactive");
    }

    return {
      service: mapping.service,
      provider: mapping.provider,
      serviceProviderMapping: mapping,
    };
  }
}
