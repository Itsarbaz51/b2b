import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export default class ProviderResolver {
  static async resolveProvider(serviceId) {
    if (!serviceId) throw ApiError.badRequest("ServiceId required");

    const service = await Prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        mappings: {
          where: { isActive: true },
          include: {
            provider: true,
          },
          orderBy: {
            priority: "asc",
          },
        },
      },
    });

    if (!service) throw ApiError.notFound("Service not found");

    if (!service.mappings.length)
      throw ApiError.badRequest("No active provider mapping found");

    // Highest priority mapping
    const serviceProviderMapping = service.mappings.find(
      (m) => m.provider && m.provider.isActive
    );

    if (!serviceProviderMapping)
      throw ApiError.badRequest("No active provider available");

    const provider = serviceProviderMapping.provider;

    return {
      service,
      provider,
      serviceProviderMapping,
    };
  }
}
