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
import { BUSINESS_ROLES, PERMISSIONS } from "../utils/constants";
import ApiIntegration from "./ApiIntegration";

const Settings = () => {
  const { currentUser = {} } = useSelector((state) => state.auth);

  const userRole = currentUser?.role?.name || currentUser?.role;
  const userType = currentUser?.role?.type || "business";

  const isEmployee = userType === "employee";
  const isAdmin = userRole === BUSINESS_ROLES.ADMIN;

  const employeePermissions = currentUser?.permissions || [];

  // ---------------- ALL TABS ----------------
  const allTabs = [
    {
      id: "general",
      label: "General Settings",
      icon: SettingsIcon,
      component: <MainSettings />,
      showToRoles: [BUSINESS_ROLES.ADMIN],
      employeePermission: PERMISSIONS.GENERAL_SETTINGS,
    },
    {
      id: "accounts",
      label: "Company Accounts",
      icon: CreditCard,
      component: <CompanyAccounts />,
      showToRoles: [
        BUSINESS_ROLES.ADMIN,
        BUSINESS_ROLES.STATE_HEAD,
        BUSINESS_ROLES.MASTER_DISTRIBUTOR,
        BUSINESS_ROLES.DISTRIBUTOR,
        BUSINESS_ROLES.RETAILER,
      ],
      employeePermission: PERMISSIONS.COMPANY_ACCOUNTS,
    },
    // {
    //   id: "services",
    //   label: "Services",
    //   icon: UserCog,
    //   component: <ManageServices />,
    //   showToRoles: [BUSINESS_ROLES.ADMIN],
    //   employeePermission: PERMISSIONS.MANAGE_SERVICES,
    // },
    {
      id: "roles",
      label: "Roles Management",
      icon: UserCog,
      component: <RoleManager />,
      showToRoles: [BUSINESS_ROLES.ADMIN],
      employeePermission: PERMISSIONS.ROLE_MANAGEMENT,
    },
    {
      id: "api-integration",
      label: "API Integration",
      icon: Cpu,
      component: <ApiIntegration />,
      showToRoles: [BUSINESS_ROLES.ADMIN],
    },
  ];

  // ---------------- FILTER TABS ----------------
  const visibleTabs = allTabs.filter((tab) => {
    // ADMIN BYPASS
    if (isAdmin) return true;

    // EMPLOYEE PERMISSION
    if (isEmployee) {
      if (!tab.employeePermission) return false;
      return employeePermissions.includes(tab.employeePermission);
    }

    // BUSINESS ROLE CHECK
    return tab.showToRoles?.includes(userRole);
  });

  // ---------------- ACTIVE TAB ----------------
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id || "general");

  useEffect(() => {
    if (!visibleTabs.find((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id);
    }
  }, [visibleTabs]);

  const activeTabConfig = visibleTabs.find((tab) => tab.id === activeTab);

  // ---------------- NO ACCESS ----------------
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

      {/* Tabs */}
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
      <div className="mt-4">{activeTabConfig?.component}</div>
    </div>
  );
};

// ---------------- NO ACCESS COMPONENT ----------------
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
