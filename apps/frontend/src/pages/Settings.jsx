import {
  Cpu,
  CreditCard,
  Settings as SettingsIcon,
  UserCog,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";

import MainSettings from "./MainSetting";
import CompanyAccounts from "./CompanyAccounts";
import ManageServices from "./ManageServices";
import RoleManager from "../components/RoleManager";
import PageHeader from "../components/ui/PageHeader";
import { usePermissions } from "../components/hooks/usePermissions";
import { BUSINESS_ROLES, PERMISSIONS } from "../utils/constants";
import ApiIntegration from "./ApiIntegration";

const Settings = () => {
  const { currentUser = {} } = useSelector((state) => state.auth);

  const permissions = usePermissions("/settings");

  // Get user role and type
  const userRole = currentUser?.role?.name || currentUser?.role;
  const userType = currentUser?.role?.type || "business";
  const isEmployee = userType === "employee";
  const isBusinessUser = !isEmployee;

  // Define all available tabs with role-based visibility - UPDATED LOGIC
  const allTabs = [
    {
      id: "general",
      label: "General Settings",
      icon: SettingsIcon,
      permission: PERMISSIONS.GENERAL_SETTINGS,
      component: <MainSettings />,
      // Show to Admin and employees with permission
      showToRoles: [BUSINESS_ROLES.ADMIN],
      showToEmployee: true,
    },
    {
      id: "accounts",
      label: "Company Accounts",
      icon: CreditCard,
      permission: PERMISSIONS.COMPANY_ACCOUNTS,
      component: <CompanyAccounts />,
      // Show to Admin and employees with permission
      showToRoles: [
        BUSINESS_ROLES.ADMIN,
        BUSINESS_ROLES.STATE_HEAD,
        BUSINESS_ROLES.MASTER_DISTRIBUTOR,
        BUSINESS_ROLES.DISTRIBUTOR,
        BUSINESS_ROLES.RETAILER,
      ],
      showToEmployee: true,
    },
    {
      id: "services",
      label: "Services",
      icon: UserCog,
      permission: PERMISSIONS.MANAGE_SERVICES,
      component: <ManageServices />,
      // Show only to Admin and employees with permission
      showToRoles: [BUSINESS_ROLES.ADMIN],
      showToEmployee: true,
    },
    {
      id: "roles",
      label: "Roles Management",
      icon: UserCog,
      permission: PERMISSIONS.ROLE_MANAGEMENT,
      component: <RoleManager />,
      // Show only to Admin and employees with permission
      showToRoles: [BUSINESS_ROLES.ADMIN],
      showToEmployee: true,
    },
    {
      id: "api-integration",
      label: "API Integration",
      icon: Cpu,
      permission: PERMISSIONS.API_INTEGRATION,
      component: <ApiIntegration />,
      // Show only to Admin and employees with permission
      showToRoles: [BUSINESS_ROLES.ADMIN],
      showToEmployee: true,
    },
  ];

  // Filter tabs based on user role and permissions - UPDATED LOGIC
  const visibleTabs = allTabs.filter((tab) => {
    // Employee users - check specific permissions
    if (isEmployee) {
      return permissions.hasPermission(tab.permission);
    }

    // Business users - check role-based rules
    if (isBusinessUser) {
      // 1. Agar specific roles ke liye show karna hai
      if (tab.showToRoles && tab.showToRoles.includes(userRole)) {
        return true;
      }

      // 2. Agar employee ke liye show karna hai (business users ke liye nahi)
      if (tab.showToEmployee) {
        return false;
      }

      // 3. Default: Agar koi specific rule nahi hai toh hide karo
      return false;
    }

    return false;
  });

  // Set active tab - Use first visible tab
  const [activeTab, setActiveTab] = useState(() => {
    return visibleTabs[0]?.id || "general";
  });

  // Update active tab if current active tab is not in visible tabs
  useEffect(() => {
    if (
      !visibleTabs.find((tab) => tab.id === activeTab) &&
      visibleTabs.length > 0
    ) {
      setActiveTab(visibleTabs[0].id);
    }
  }, [visibleTabs, activeTab]);

  // Render active tab component
  const renderActiveTab = () => {
    const activeTabConfig = allTabs.find((tab) => tab.id === activeTab);

    if (!activeTabConfig) {
      return <NoAccess />;
    }

    // Check if user has permission for this tab
    if (isEmployee) {
      if (!permissions.hasPermission(activeTabConfig.permission)) {
        return <NoAccess />;
      }
    }

    // For business users, check if they should have access to this tab
    if (isBusinessUser) {
      const shouldHaveAccess =
        activeTabConfig.showToRoles &&
        activeTabConfig.showToRoles.includes(userRole);

      if (!shouldHaveAccess) {
        return <NoAccess />;
      }
    }

    return activeTabConfig.component;
  };

  // Show no access message if no tabs are available
  if (visibleTabs.length === 0) {
    return (
      <div>
        <PageHeader
          breadcrumb={["Dashboard", "Settings"]}
          title="Settings"
          description="Manage your application settings and configurations"
        />
        <div className="mt-8">
          <NoAccess message="You don't have permission to access any settings." />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        breadcrumb={["Dashboard", "Settings"]}
        title="Settings"
        description="Manage your application settings and configurations"
      />

      {/* Tabs Navigation */}
      <div className="flex space-x-1 my-8 bg-gray-100 p-1 rounded-lg w-fit">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-md transition-all ${
              activeTab === tab.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <tab.icon className="h-4 w-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">{renderActiveTab()}</div>
    </div>
  );
};

const NoAccess = ({
  message = "You don't have permission to view this section.",
}) => (
  <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
    <div className="max-w-md mx-auto">
      <SettingsIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Access Denied
      </h3>
      <p className="text-gray-500">{message}</p>
    </div>
  </div>
);

export default Settings;
