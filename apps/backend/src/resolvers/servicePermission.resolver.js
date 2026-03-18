import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export default class ServicePermissionResolver {
  static async validateByMappingId(userId, mappingId) {
    if (!userId || !mappingId) {
      throw ApiError.badRequest("UserId and MappingId required");
    }

    // 🔥 STEP 1: mapping fetch
    const mapping = await Prisma.serviceProviderMapping.findUnique({
      where: { id: mappingId },
      include: {
        provider: true,
        service: true,
      },
    });

    if (!mapping) {
      throw ApiError.notFound("Mapping not found");
    }

    if (!mapping.isActive || !mapping.provider?.isActive) {
      throw ApiError.forbidden("Inactive provider mapping");
    }

    if (!mapping.service?.isActive) {
      throw ApiError.forbidden("Service is inactive");
    }

    const serviceId = mapping.serviceId;

    // 🔥 STEP 2: hierarchy permission check
    let currentUser = await Prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!currentUser) {
      throw ApiError.notFound("User not found");
    }

    while (currentUser) {
      const userPermission = await Prisma.userPermission.findUnique({
        where: {
          userId_serviceId: {
            userId: currentUser.id,
            serviceId,
          },
        },
      });

      if (userPermission) {
        if (!userPermission.canProcess) {
          throw ApiError.forbidden(
            `Service blocked at user level (${currentUser.id})`
          );
        }
      } else {
        const rolePermission = await Prisma.rolePermission.findUnique({
          where: {
            roleId_serviceId: {
              roleId: currentUser.roleId,
              serviceId,
            },
          },
        });

        if (rolePermission && !rolePermission.canProcess) {
          throw ApiError.forbidden(
            `Service blocked at role level (${currentUser.roleId})`
          );
        }
      }

      if (!currentUser.parentId) break;

      currentUser = await Prisma.user.findUnique({
        where: { id: currentUser.parentId },
        include: { role: true },
      });
    }

    // ✅ return full mapping (IMPORTANT 🔥)
    return mapping;
  }
}
