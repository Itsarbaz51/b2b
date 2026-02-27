import { useMemo } from "react";
import { useSelector } from "react-redux";
import { PERMISSIONS, USER_TYPES } from "../../utils/constants";
import { ROUTE_CONFIG } from "../../utils/constants";
import { PermissionNormalizer } from "../../utils/permissionsNormalizer";

export const usePermissions = (routePath = null) => {
  const { currentUser } = useSelector((state) => state.auth);

  return useMemo(() => {
    if (!currentUser) {
      return createFallbackPermissions();
    }

    // Normalize user permissions
    const normalized = PermissionNormalizer.normalize(currentUser);
    const { permissions, services, userType, role } = normalized;

    // Create permission check functions
    const hasPermission = (permissionKey) => {
      if (userType === USER_TYPES.BUSINESS) {
        // Business users ke liye FUND_REQUEST permission check karo
        if (permissionKey === PERMISSIONS.FUND_REQUEST) {
          return services.length > 0; // At least one service available
        }
        return true;
      }

      // Employee users ke liye
      if (userType === USER_TYPES.EMPLOYEE) {
        return permissions.some(
          (perm) => perm.key === permissionKey.toLowerCase()
        );
      }

      return false;
    };

    const hasService = (serviceCode) => {
      return services.some(
        (service) => service.code === serviceCode && service.canView
      );
    };

    const canAccessRoute = (path = routePath) => {
      if (!path || ROUTE_CONFIG.PUBLIC.includes(path)) return true;

      // SPECIAL CASE: ADMIN ko /request-fund se block karo
      const userRole = currentUser?.role?.name || currentUser?.role;
      if (path === "/request-fund" && userRole === "ADMIN") {
        return false;
      }

      // SPECIAL CASE: Settings page - FIXED LOGIC
      if (path === "/settings") {
        if (userType === USER_TYPES.BUSINESS) {
          return true; // Business users ko settings access dena
        }
        if (userType === USER_TYPES.EMPLOYEE) {
          // Employee ko settings access tabhi dena agar koi settings tab available ho
          const settingsTabs = getPageTabs("/settings");
          return settingsTabs.length > 0;
        }
      }

      if (userType === USER_TYPES.BUSINESS) {
        // Business users ke liye FUND_REQUEST route check
        if (path === "/request-fund") {
          return services.length > 0; // At least one service available
        }
        return true;
      }

      // Employee users ke liye
      if (userType === USER_TYPES.EMPLOYEE) {
        const requiredPermission = ROUTE_CONFIG.ROUTE_PERMISSION_MAP[path];
        if (!requiredPermission) return true;

        return hasPermission(requiredPermission);
      }

      return false;
    };

    const getPageTabs = (pagePath) => {
      const pageTabs = ROUTE_CONFIG.PAGE_TABS[pagePath] || [];

      if (userType === USER_TYPES.BUSINESS) {
        // Business users ke liye fund tabs filter karo based on available services
        if (pagePath === "/request-fund") {
          return pageTabs.filter((tab) =>
            services.some((service) => service.code === tab.permission)
          );
        }
        return pageTabs;
      }

      // Employee users ke liye - Filter tabs based on permissions
      if (userType === USER_TYPES.EMPLOYEE) {
        return pageTabs.filter((tab) => hasPermission(tab.permission));
      }

      return [];
    };

    // Specific permission checks
    const specificPermissions = {
      // Page permissions
      hasDashboard: hasPermission(PERMISSIONS.DASHBOARD),
      hasMembers: hasPermission(PERMISSIONS.MEMBERS),
      hasCommission: hasPermission(PERMISSIONS.COMMISSION),
      hasTransactions: hasPermission(PERMISSIONS.TRANSACTIONS),
      hasPayout: hasPermission(PERMISSIONS.PAYOUT),
      hasKycRequest: hasPermission(PERMISSIONS.KYC_REQUEST),
      hasEmployeeManagement: hasPermission(PERMISSIONS.EMPLOYEE_MANAGEMENT),
      hasReports: hasPermission(PERMISSIONS.REPORTS),
      hasLogs: hasPermission(PERMISSIONS.LOGS),
      hasSettings: hasPermission(PERMISSIONS.SETTINGS),
      hasFundRequest: hasPermission(PERMISSIONS.FUND_REQUEST),

      // Settings tabs
      hasGeneralSettings: hasPermission(PERMISSIONS.GENERAL_SETTINGS),
      hasCompanyAccounts: hasPermission(PERMISSIONS.COMPANY_ACCOUNTS),
      hasManageServices: hasPermission(PERMISSIONS.MANAGE_SERVICES),
      hasRoleManagement: hasPermission(PERMISSIONS.ROLE_MANAGEMENT),
      hasApiIntegration: hasPermission(PERMISSIONS.API_INTEGRATION),

      // Services
      hasRazorpay: hasService(PERMISSIONS.RAZORPAY),
      hasBankTransfer: hasService(PERMISSIONS.BANK_TRANSFER),
    };

    // Feature flags - FIXED: Same logic for both user types
    const settingsTabs = getPageTabs("/settings");
    const fundTabs = getPageTabs("/request-fund");

    // YAHAN FIX HAI: Dono user types ke liye same logic
    const showSettings = settingsTabs.length > 0;
    const showAddFund =
      fundTabs.length > 0 && hasPermission(PERMISSIONS.FUND_REQUEST);

    return {
      // Core functions
      hasPermission,
      hasService,
      canAccessRoute,
      getPageTabs,

      // User info
      userType,
      userRole: role,
      isBusinessUser: userType === USER_TYPES.BUSINESS,
      isEmployee: userType === USER_TYPES.EMPLOYEE,

      // Normalized data
      normalizedPermissions: permissions,
      normalizedServices: services,

      // Feature flags
      showSettings,
      showAddFund,

      // Specific permissions (for direct access)
      ...specificPermissions,

      // Utility
      hasAnyPermission: permissions.length > 0,
      hasAnyService: services.length > 0,
      hasAnyAccess: permissions.length > 0 || services.length > 0,
    };
  }, [currentUser, routePath]);
};

function createFallbackPermissions() {
  const fallbackFn = () => false;
  return {
    hasPermission: fallbackFn,
    hasService: fallbackFn,
    canAccessRoute: fallbackFn,
    getPageTabs: () => [],
    userType: null,
    userRole: null,
    isBusinessUser: false,
    isEmployee: false,
    normalizedPermissions: [],
    normalizedServices: [],
    showSettings: false,
    showAddFund: false,
    hasAnyPermission: false,
    hasAnyService: false,
    hasAnyAccess: false,

    // All specific permissions as false
    hasDashboard: false,
    hasMembers: false,
    hasCommission: false,
    hasTransactions: false,
    hasPayout: false,
    hasKycRequest: false,
    hasEmployeeManagement: false,
    hasReports: false,
    hasLogs: false,
    hasSettings: false,
    hasFundRequest: false,
    hasGeneralSettings: false,
    hasCompanyAccounts: false,
    hasManageServices: false,
    hasRoleManagement: false,
    hasApiIntegration: false,
    hasRazorpay: false,
    hasBankTransfer: false,
  };
}
