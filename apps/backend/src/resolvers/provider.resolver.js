import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export default class ProviderResolver {
  static async resolveProviderCode(serviceId) {
    const service = await Prisma.serviceProvider.findUnique({
      where: { id: serviceId },
    });

    if (!service) throw ApiError.badRequest("Invalid service");

    //  If service has parent → parent is provider
    if (service.parentId) {
      const provider = await Prisma.serviceProvider.findUnique({
        where: { id: service.parentId },
      });

      if (!provider) throw ApiError.badRequest("Provider not found");

      return provider.code;
    }

    // 🔥 If no parent → this itself is provider
    return service.code;
  }
}
