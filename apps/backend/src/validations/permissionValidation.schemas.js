import { z } from "zod";

class PermissionValidationSchemas {
  static get createOrUpdateRolePermission() {
    return z.object({
      roleId: z.string().uuid("Invalid role ID"),
      serviceIds: z.array(z.string().uuid("Invalid service ID")),
      canView: z.boolean().default(false),
      canEdit: z.boolean().default(false),
      canSetCommission: z.boolean().default(false),
      canProcess: z.boolean().default(false),
    });
  }

  static get createOrUpdateUserPermission() {
    return z.object({
      userId: z.string().uuid("Invalid user ID"),
      serviceIds: z.array(z.string().uuid("Invalid service ID")),
      canView: z.boolean().default(false),
      canEdit: z.boolean().default(false),
      canSetCommission: z.boolean().default(false),
      canProcess: z.boolean().default(false),
    });
  }

  static get deleteRolePermission() {
    return z.object({
      roleId: z.string().uuid("Invalid role ID"),
      serviceId: z.string().uuid("Invalid service ID"),
    });
  }

  static get deleteUserPermission() {
    return z.object({
      userId: z.string().uuid("Invalid user ID"),
      serviceId: z.string().uuid("Invalid service ID"),
    });
  }
}

export default PermissionValidationSchemas;
