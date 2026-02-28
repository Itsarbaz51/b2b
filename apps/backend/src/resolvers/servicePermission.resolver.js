import Prisma from "../db/db.js";
import { ApiError } from "../utils/ApiError.js";

export default class ServicePermissionResolver {
  static async validateHierarchyServiceAccess(userId, serviceId) {
    let currentUser = await Prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    while (currentUser) {
      // UserPermission check
      const userPermission = await Prisma.userPermission.findUnique({
        where: {
          userId_serviceId: {
            userId: currentUser.id,
            serviceId,
          },
        },
      });

      if (userPermission) {
        if (!userPermission.canView)
          throw ApiError.forbidden("Service blocked in hierarchy");
      } else {
        // RolePermission fallback
        const rolePermission = await Prisma.rolePermission.findUnique({
          where: {
            roleId_serviceId: {
              roleId: currentUser.roleId,
              serviceId,
            },
          },
        });

        if (!rolePermission || !rolePermission.canView)
          throw ApiError.forbidden("Service blocked in hierarchy");
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
