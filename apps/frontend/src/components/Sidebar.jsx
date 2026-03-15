import { Link, useLocation } from "react-router-dom";
import {
  BarChart3,
  ArrowDownCircle,
  Shield,
  Users,
  Percent,
  Settings,
  Play,
  LogOut,
  History,
  Wallet,
  BadgeIndianRupee,
  FileCode,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";
import { BUSINESS_ROLES, PERMISSIONS, SERVICES } from "../utils/constants";
import { usePermissions } from "./hooks/usePermission";

const Sidebar = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const { currentUser, isAuthenticated } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  const BUSINESS_ROLE_LIST = Object.values(BUSINESS_ROLES);

  // service permissions
  const fundRequestPermissions = usePermissions(SERVICES.FUND_REQUEST);
  const payoutPermissions = usePermissions(SERVICES.PAYOUT);

  const userData = currentUser || {};
  const role = userData.role?.name || userData.role || "USER";
  const roleType = userData.role?.type || "business";

  const employeePermissions = userData?.permissions || [];

  // Base menu items structure - IMPROVED: Better permission checks
  const baseMenuItems = [
    {
      title: "Main",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: BarChart3,
          path: "/dashboard",
          employeePermission: PERMISSIONS.DASHBOARD,
          staticRoles: BUSINESS_ROLE_LIST,
        },
        {
          id: "users",
          label: "Users",
          icon: Users,
          path: "/users",
          employeePermission: PERMISSIONS.USERS,
          staticRoles: [
            "ADMIN",
            "STATE HEAD",
            "MASTER DISTRIBUTOR",
            "DISTRIBUTOR",
          ],
        },
        {
          id: "commission",
          label: "Commission",
          icon: Percent,
          path: "/commission-management",
          employeePermission: PERMISSIONS.COMMISSION,
          staticRoles: BUSINESS_ROLE_LIST,
        },
        {
          id: "transactions",
          label: "Transactions",
          icon: History,
          path: "/transactions",
          employeePermission: PERMISSIONS.TRANSACTIONS,
          staticRoles: BUSINESS_ROLE_LIST,
        },
      ],
    },
    {
      title: "Services",
      items: [
        {
          id: "add-fund",
          label: "Add Fund",
          icon: BadgeIndianRupee,
          path: "/request-fund",
          businessUserPermission: fundRequestPermissions.canView,
          employeePermission: PERMISSIONS.FUND_REQUEST,
          staticRoles: [
            "ADMIN",
            "STATE HEAD",
            "MASTER DISTRIBUTOR",
            "DISTRIBUTOR",
            "RETAILER",
          ],
        },
        {
          id: "payout",
          label: "Payout",
          icon: ArrowDownCircle,
          path: "/payout",
          businessPermission: payoutPermissions.canView,
          employeePermission: PERMISSIONS.PAYOUT,
          staticRoles: [
            "ADMIN",
            "STATE HEAD",
            "MASTER DISTRIBUTOR",
            "DISTRIBUTOR",
            "RETAILER",
          ],
        },
      ],
    },
    {
      title: "Administration",
      items: [
        {
          id: "request-kyc",
          label: "KYC Request",
          icon: Shield,
          path: "/kyc-request",
          employeePermission: PERMISSIONS.KYC_REQUEST,
          staticRoles: [
            "ADMIN",
            "STATE HEAD",
            "MASTER DISTRIBUTOR",
            "DISTRIBUTOR",
          ],
        },
        {
          id: "employee-management",
          label: "Employee Management",
          icon: Users,
          path: "/employee-management",
          employeePermission: PERMISSIONS.EMPLOYEE_MANAGEMENT,
          staticRoles: ["ADMIN"],
        },
        {
          id: "reports",
          label: "Reports",
          icon: BarChart3,
          path: "/reports",
          employeePermission: PERMISSIONS.REPORTS,
          staticRoles: ["ADMIN"],
        },
        {
          id: "logs",
          label: "Logs",
          icon: FileCode,
          path: "/logs",
          employeePermission: PERMISSIONS.LOGS,
          staticRoles: BUSINESS_ROLE_LIST,
        },
      ].filter((item) => {
        // FIXED: Better show condition check
        if (item.show !== undefined) {
          return item.show === true;
        }
        return true;
      }),
    },
    {
      title: "System",
      items: [
        {
          id: "settings",
          label: "Settings",
          icon: Settings,
          path: "/settings",
          employeePermission: PERMISSIONS.SETTINGS,
          staticRoles: BUSINESS_ROLE_LIST,
        },
      ].filter((item) => {
        if (item.show !== undefined) {
          return item.show === true;
        }
        return true;
      }),
    },
  ];

  // Filter menu sections based on user role and  - IMPROVED LOGIC
  const filteredMenuSections = baseMenuItems
    .map((section) => {
      const filteredItems = section.items.filter((item) => {
        let roleAllowed = true;
        let permissionAllowed = true;

        // business role check
        if (roleType === "business") {
          roleAllowed = item.staticRoles?.includes(role);
        }

        // business service permission
        if (
          roleType === "business" &&
          item.businessUserPermission !== undefined
        ) {
          permissionAllowed = item.businessUserPermission;
        }

        // employee permission
        if (roleType === "employee" && item.employeePermission) {
          permissionAllowed = employeePermissions.includes(
            item.employeePermission,
          );
        }

        return roleAllowed && permissionAllowed;
      });

      return { ...section, items: filteredItems };
    })
    .filter((section) => section.items.length > 0);

  const MenuItem = ({ item }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <Link
        to={item.path}
        className={`group flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive ? "bg-gray-200 shadow-xs" : "hover:bg-gray-300"
        }`}
      >
        <Icon
          className={`h-5 w-5 mr-3 transition-transform duration-200 ${
            isActive ? "scale-110" : "group-hover:scale-105"
          }`}
        />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const MenuSection = ({ title, items }) =>
    items.length > 0 && (
      <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 px-3">
          {title}
        </h3>
        <div className="space-y-1">
          {items.map((item) => (
            <MenuItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    );

  // Get user details for display
  const firstName = userData.firstName || "";
  const lastName = userData.lastName || "";
  const username = userData.username || "";
  const profileImage = userData.profileImage || "";
  const walletBalance = userData.wallets?.[0]?.balance || 0;

  // Get initials for avatar
  const initials = firstName
    ? firstName[0].toUpperCase()
    : username
      ? username[0].toUpperCase()
      : "U";

  // Show loading state if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="w-64 flex flex-col fixed h-screen border-r border-gray-300 bg-white">
        <div className="p-6 border-b border-gray-300">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center">
              <Play className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Payment System</h2>
              <p className="text-xs text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Determine panel type for display
  const getPanelType = () => {
    if (BUSINESS_ROLE_LIST.includes(role)) {
      return `${role} Panel`;
    } else if (roleType === "employee") {
      return `${role} (Employee) Panel`;
    }
    return "User Panel";
  };

  return (
    <div className="w-64 flex flex-col fixed h-screen border-r border-gray-300 bg-white z-50">
      {/* Header */}
      <div className="p-6 border-b border-gray-300">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center">
            <Play className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Payment System</h2>
            <p className="text-xs text-gray-600">{getPanelType()}</p>
          </div>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4">
        <div className="backdrop-blur-sm rounded-xl p-4 border text-black border-gray-300">
          <div className="flex items-center mb-3">
            {profileImage ? (
              <img
                src={profileImage}
                alt={firstName || "User"}
                className="h-12 w-12 rounded-full object-contain border border-gray-300 shadow-sm"
              />
            ) : (
              <div className="h-12 w-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-lg">
                {initials}
              </div>
            )}

            <div className="ml-3 flex-1 min-w-0">
              <p className="font-medium text-sm truncate capitalize">
                {firstName && lastName
                  ? `${firstName} ${lastName}`.trim()
                  : firstName
                    ? firstName
                    : username || "User"}
              </p>
              <p className="text-xs capitalize text-gray-500 truncate">
                {username || "username"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {BUSINESS_ROLE_LIST.includes(role)
                  ? "Business User"
                  : "Employee"}
              </p>
            </div>
          </div>

          {/* Wallet Section - Only show for business users */}
          {BUSINESS_ROLE_LIST.includes(role) && (
            <div className="bg-gray-100 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Wallet Balance</span>
                <Wallet className="h-3 w-3 text-gray-500" />
              </div>
              <p className="text-sm font-semibold mt-1 text-gray-800">
                ₹{walletBalance.toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 pb-4 overflow-y-auto">
        {filteredMenuSections.map((section) => (
          <MenuSection
            key={section.title}
            title={section.title}
            items={section.items}
          />
        ))}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-gray-300">
        <button
          onClick={handleLogout}
          className="w-full cursor-pointer hover:bg-red-100 flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group"
        >
          <LogOut className="h-5 w-5 mr-3 text-red-600 group-hover:scale-105 transition-transform duration-200" />
          <span className="font-medium text-red-600">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
