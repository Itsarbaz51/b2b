import { PERMISSION_TYPES, USER_TYPES, BUSINESS_ROLES } from "./constants.js";

/**
 * Normalizes different permission formats into a unified structure
 */
export class PermissionNormalizer {
  static normalize(userData) {
    if (!userData) return { permissions: [], services: [], userType: null };

    const role = userData.role?.name || userData.role;

    // Determine user type
    const isBusinessUser = Object.values(BUSINESS_ROLES).includes(role);
    const userType = isBusinessUser ? USER_TYPES.BUSINESS : USER_TYPES.EMPLOYEE;

    const rawPermissions = userData.userPermissions || [];

    if (userType === USER_TYPES.EMPLOYEE) {
      return this.normalizeEmployeePermissions(rawPermissions, role);
    } else {
      return this.normalizeBusinessPermissions(rawPermissions, role);
    }
  }

  /**
   * Employee permissions come as string array
   * Example: ["transactions", "General Settings", "Company Accounts"]
   */
  static normalizeEmployeePermissions(rawPermissions, role) {
    const permissions = [];
    const services = [];

    rawPermissions.forEach((perm) => {
      if (typeof perm === "string") {
        // Check if it's a service permission
        if (["RAZORPAY", "BANK_TRANSFER"].includes(perm)) {
          services.push({
            code: perm,
            canView: true,
            type: PERMISSION_TYPES.SERVICE,
          });
        } else {
          permissions.push({
            key: perm.toLowerCase().trim(),
            type: this.determinePermissionType(perm),
            original: perm,
          });
        }
      }
    });

    return {
      permissions,
      services,
      userType: USER_TYPES.EMPLOYEE,
      role,
    };
  }

  /**
   * Business permissions come as objects with service info
   * Example: [{ canView: true, service: { code: "BANK_TRANSFER" } }]
   */
  static normalizeBusinessPermissions(rawPermissions, role) {
    const permissions = [];
    const services = [];

    rawPermissions.forEach((perm) => {
      if (typeof perm === "object" && perm.service) {
        // Service-based permission
        if (perm.canView) {
          services.push({
            code: perm.service.code,
            canView: true,
            type: PERMISSION_TYPES.SERVICE,
            original: perm,
          });
        }
      } else if (typeof perm === "string") {
        // String permission (for employee-like business users)
        permissions.push({
          key: perm.toLowerCase().trim(),
          type: this.determinePermissionType(perm),
          original: perm,
        });
      }
    });

    return {
      permissions,
      services,
      userType: USER_TYPES.BUSINESS,
      role,
    };
  }

  static determinePermissionType(permission) {
    const perm = permission.toLowerCase();

    if (
      perm.includes("settings") ||
      [
        "general settings",
        "company accounts",
        "services",
        "roles management",
        "api integration",
      ].includes(perm)
    ) {
      return PERMISSION_TYPES.SETTINGS_TAB;
    }

    return PERMISSION_TYPES.PAGE;
  }
}
