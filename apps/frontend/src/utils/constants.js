export const PERMISSIONS = {
  // page
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

export const SERVICES = {
  FUND_REQUEST: {
    RAZORPAY: "RAZORPAY",
    BANK_TRANSFER: "BANK_TRANSFER",
  },
  PAN: "PAN",
  AADHAAR: "AADHAAR",
  PAYOUT: "PAYOUT",
};

// Static Business Roles
export const BUSINESS_ROLES = {
  ADMIN: "ADMIN",
  STATE_HEAD: "STATE HEAD",
  MASTER_DISTRIBUTOR: "MASTER DISTRIBUTOR",
  DISTRIBUTOR: "DISTRIBUTOR",
  RETAILER: "RETAILER",
};

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
};
