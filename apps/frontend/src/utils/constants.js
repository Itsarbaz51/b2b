// src/core/permissions/constants.js
export const PERMISSION_TYPES = {
  PAGE: "page",
  SERVICE: "service",
  SETTINGS_TAB: "settings_tab",
  FEATURE: "feature",
};

// All Available Permissions
export const PERMISSIONS = {
  // Page Access
  DASHBOARD: "dashboard",
  MEMBERS: "members",
  COMMISSION: "commission",
  TRANSACTIONS: "transactions",
  PAYOUT: "payout",
  KYC_REQUEST: "kyc request",
  EMPLOYEE_MANAGEMENT: "employee management",
  REPORTS: "reports",
  LOGS: "logs",
  SETTINGS: "settings",
  FUND_REQUEST: "fund request",

  // Services
  RAZORPAY: "RAZORPAY",
  BANK_TRANSFER: "BANK_TRANSFER",

  // Settings Tabs
  GENERAL_SETTINGS: "General Settings",
  COMPANY_ACCOUNTS: "Company Accounts",
  MANAGE_SERVICES: "Services",
  ROLE_MANAGEMENT: "Roles Management",
  API_INTEGRATION: "API Integration",

  // Features
  VIEW: "view",
  CREATE: "create",
  EDIT: "edit",
  DELETE: "delete",
};

// User Role Types
export const USER_TYPES = {
  BUSINESS: "business",
  EMPLOYEE: "employee",
};

// Static Business Roles
export const BUSINESS_ROLES = {
  ADMIN: "ADMIN",
  STATE_HEAD: "STATE HEAD",
  MASTER_DISTRIBUTOR: "MASTER DISTRIBUTOR",
  DISTRIBUTOR: "DISTRIBUTOR",
  RETAILER: "RETAILER",
};

// for usePermissionHook
// Route Configuration
export const ROUTE_CONFIG = {
  PUBLIC: [
    "/",
    "/about",
    "/contact",
    "/login",
    "/privacy-policy",
    "/terms-conditions",
    "/permission-denied",
    "/logout",
  ],

  // Route to Permission Mapping
  ROUTE_PERMISSION_MAP: {
    "/dashboard": PERMISSIONS.DASHBOARD,
    "/members": PERMISSIONS.MEMBERS,
    "/commission": PERMISSIONS.COMMISSION,
    "/transactions": PERMISSIONS.TRANSACTIONS,
    "/card-payout": PERMISSIONS.PAYOUT,
    "/kyc-request": PERMISSIONS.KYC_REQUEST,
    "/employee-management": PERMISSIONS.EMPLOYEE_MANAGEMENT,
    "/reports": PERMISSIONS.REPORTS,
    "/logs": PERMISSIONS.LOGS,
    "/settings": PERMISSIONS.SETTINGS,
    "/request-fund": PERMISSIONS.FUND_REQUEST,
  },

  // Page Tabs Configuration
  PAGE_TABS: {
    "/settings": [
      {
        id: "general",
        label: "General Settings",
        permission: PERMISSIONS.GENERAL_SETTINGS,
      },
      {
        id: "accounts",
        label: "Company Accounts",
        permission: PERMISSIONS.COMPANY_ACCOUNTS,
      },
      {
        id: "services",
        label: "Services",
        permission: PERMISSIONS.MANAGE_SERVICES,
      },
      {
        id: "roles",
        label: "Roles Management",
        permission: PERMISSIONS.ROLE_MANAGEMENT,
      },
      {
        id: "api-integration",
        label: "API Integration",
        permission: PERMISSIONS.API_INTEGRATION,
      },
    ],

    "/request-fund": [
      { id: "razorpay", label: "Razorpay", permission: PERMISSIONS.RAZORPAY },
      {
        id: "bank-transfer",
        label: "Bank Transfer",
        permission: PERMISSIONS.BANK_TRANSFER,
      },
    ],
  },
};
