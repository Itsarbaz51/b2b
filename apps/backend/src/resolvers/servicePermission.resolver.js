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
        mappings: {
          include: {
            provider: true,
          },
        },
      },
    });

    if (!service) throw ApiError.notFound("Service not found");

    if (!service.isActive)
      throw ApiError.forbidden("Service is inactive contact your admin");

    if (!service.mappings || service.mappings.length === 0)
      throw ApiError.forbidden("Service provider mapping missing");

    // ✅ Get active provider mapping (priority supported)
    const activeMapping = service.mappings
      .filter((m) => m.isActive && m.provider?.isActive)
      .sort((a, b) => a.priority - b.priority)[0];

    if (!activeMapping)
      throw ApiError.forbidden(
        "No active provider mapping available contact admin"
      );

    // ===========================
    // HIERARCHY PERMISSION CHECK
    // ===========================

    let currentUser = await Prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!currentUser) throw ApiError.notFound("User not found");

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
        if (!userPermission.canProcess)
          throw ApiError.forbidden(
            `Service blocked at user level (${currentUser.id})`
          );
      } else {
        const rolePermission = await Prisma.rolePermission.findUnique({
          where: {
            roleId_serviceId: {
              roleId: currentUser.roleId,
              serviceId,
            },
          },
        });

        if (rolePermission && !rolePermission.canProcess)
          throw ApiError.forbidden(
            `Service blocked at role level (${currentUser.roleId})`
          );
      }

      if (!currentUser.parentId) break;

      currentUser = await Prisma.user.findUnique({
        where: { id: currentUser.parentId },
        include: { role: true },
      });
    }

    // ✅ Return mapping for execution layer
    return activeMapping;
  }
}
