import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export default class ServicePermissionResolver {
  static async validateHierarchyServiceAccess(userId, serviceId) {
    if (!userId || !serviceId)
      throw ApiError.badRequest("UserId and ServiceId required");

    // SERVICE + PROVIDER VALIDATION
    const service = await Prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        serviceProviderMapping: {
          include: {
            provider: true,
          },
        },
      },
    });

    if (!service) throw ApiError.notFound("Service not found");

    if (!service.isActive)
      throw ApiError.forbidden("Service is inactive contact your admin");

    if (!service.serviceProviderMapping)
      throw ApiError.forbidden("Service provider mapping missing");

    if (!service.serviceProviderMapping.isActive)
      throw ApiError.forbidden(
        "Service provider mapping inactive contact your admin"
      );

    if (!service.serviceProviderMapping.provider)
      throw ApiError.forbidden("Provider not found");

    if (!service.serviceProviderMapping.provider.isActive)
      throw ApiError.forbidden("Provider inactive contact your admin");

    // HIERARCHY PERMISSION CHECK
    let currentUser = await Prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!currentUser) throw ApiError.notFound("User not found");

    while (currentUser) {
      // USER LEVEL PERMISSION
      const userPermission = await Prisma.userPermission.findUnique({
        where: {
          userId_serviceId: {
            userId: currentUser.id,
            serviceId,
          },
        },
      });

      if (userPermission) {
        if (!userPermission.canProcess)
          throw ApiError.forbidden(
            `Service blocked at user level (${currentUser.id})`
          );
      } else {
        // ROLE LEVEL FALLBACK
        const rolePermission = await Prisma.rolePermission.findUnique({
          where: {
            roleId_serviceId: {
              roleId: currentUser.roleId,
              serviceId,
            },
          },
        });

        if (!rolePermission)
          throw ApiError.forbidden(
            `Role permission missing (${currentUser.roleId})`
          );

        if (!rolePermission.canProcess)
          throw ApiError.forbidden(
            `Service blocked at role level (${currentUser.roleId})`
          );
      }

      // Move to parent
      if (!currentUser.parentId) break;

      currentUser = await Prisma.user.findUnique({
        where: { id: currentUser.parentId },
        include: { role: true },
      });
    }

    return true;
  }
}
