export const protectedRoute = [
  "/dashboard",
  "/payout",
  "/transactions",
  "/users",
  "/commission-management",
  "/reports",
  "/ledger",
  "/kyc",
  "/users",
  "/settings",
  "/employee-management",
  "/wallet",
  "/kyc-request",
  "/request-fund",
  "/permission",
  "/profile/:id",
  "/logs",
  "/payout",
  "/verify-reset-password",
];

import {
  Wallet,
  ArrowDownCircle,
  Users,
  Percent,
  BarChart3,
  Shield,
  FileText,
  Settings,
  User,
  BadgeIndianRupee,
  Activity,
} from "lucide-react";

export const navbarTitleConfig = {
  "/dashboard": {
    title: "Dashboard",
    tagLine: "Overview of your system",
    icon: BarChart3,
  },
  "/request-fund": {
    title: "Add Fund Request",
    tagLine: "Manage fund request",
    icon: BadgeIndianRupee,
  },
  "/payout": {
    title: "Payout",
    tagLine: "Manage outgoing transactions",
    icon: ArrowDownCircle,
  },
  "/transactions": {
    title: "Transactions",
    tagLine: "All payment history",
    icon: FileText,
  },
  "/users": {
    title: "Users",
    tagLine: "Manage all users",
    icon: User,
  },
  "/users": {
    title: "Users",
    tagLine: "Manage your platform users",
    icon: Users,
  },
  "/commission-management": {
    title: "Commission Settings",
    tagLine: "Configure your commission rates",
    icon: Percent,
  },
  "/reports": {
    title: "Reports",
    tagLine: "Analytics & insights",
    icon: BarChart3,
  },
  "/ledger": {
    title: "Ledger",
    tagLine: "Analytics & insights",
    icon: BarChart3,
  },
  "/kyc-request": {
    title: "KYC Verification",
    tagLine: "Verify your customers",
    icon: Shield,
  },
  "/wallet": {
    title: "Wallet",
    tagLine: "Wallet Management System",
    icon: Wallet,
  },
  "/settings": {
    title: "Settings",
    tagLine: "Manage application settings",
    icon: Settings,
  },
  "/employee-management": {
    title: "Employee Management",
    tagLine: "Manage Employee",
    icon: Users,
  },
  "/profile/:id": {
    title: "Profile",
    tagLine: "View and manage your profile",
    icon: User,
  },
  "/logs": {
    title: "Audit logs",
    tagLine: "View and manage your audit logs",
    icon: Activity,
  },
};
