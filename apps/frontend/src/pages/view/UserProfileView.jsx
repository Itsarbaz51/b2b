import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  CheckCircle,
  XCircle,
  Users,
  Eye,
  EyeOff,
  TrendingUp,
  Lock,
  X,
  Wallet,
  Briefcase,
  Hash,
  Building,
  UserCheck,
  Key,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { getUserById } from "../../redux/slices/userSlice";
import { getEmployeeById } from "../../redux/slices/employeeSlice";

export default function UserProfileView({
  isAdminUser,
  userId,
  onClose,
  type,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showTransactionPin, setShowTransactionPin] = useState(false);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  // Determine user type and adjust data structure accordingly
  const isEmployee = type === "employee";
  const userTypeLabel = isEmployee ? "Employee" : "Business";
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setError(null);

        let result;
        if (isEmployee) {
          result = await dispatch(getEmployeeById(userId));
        } else if (type === "business") {
          result = await dispatch(getUserById(userId));
        }

        // Handle different response structures
        if (result?.payload?.data?.user) {
          // If data is nested under payload.data.user
          setUserData(result.payload.data.user);
        } else if (result?.payload?.data) {
          // If data is nested under payload.data
          setUserData(result.payload.data);
        } else if (result?.data?.user) {
          // If data is directly under result.data.user
          setUserData(result.data.user);
        } else if (result?.data) {
          // If data is directly under result.data
          setUserData(result.data);
        } else if (result?.payload) {
          // If data is under payload
          setUserData(result.payload);
        } else {
          throw new Error("No data received");
        }
      } catch (err) {
        console.error("Error in fetchUserData:", err);
        setError(err.message || "Failed to fetch user data");
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId, isEmployee, type, dispatch]);

  // Fixed data adaptation function
  const adaptUserData = (rawData) => {
    if (!rawData) {
      return null;
    }

    // For employee data from your API
    if (isEmployee) {
      return {
        // Common fields
        id: rawData?.id,
        firstName: rawData?.firstName,
        lastName: rawData?.lastName,
        username: rawData?.username,
        email: rawData?.email,
        phoneNumber: rawData?.phoneNumber,
        profileImage: rawData?.profileImage,
        status: rawData?.status,
        isKycVerified: rawData?.isKycVerified,
        isAuthorized: rawData?.isAuthorized,
        hierarchyLevel: rawData?.hierarchyLevel,
        hierarchyPath: rawData?.hierarchyPath,
        parentId: rawData?.parentId,
        parent: rawData?.parent,
        children: rawData?.children,
        createdAt: rawData?.createdAt,
        updatedAt: rawData?.updatedAt,
        emailVerifiedAt: rawData?.emailVerifiedAt,
        deletedAt: rawData?.deletedAt,
        deactivationReason: rawData?.deactivationReason,

        // Security fields
        password: rawData?.password,
        transactionPin: rawData?.transactionPin,

        // Role information
        role: rawData?.role || {
          name: "Employee",
          level: rawData?.hierarchyLevel,
        },

        // Employee-specific fields
        employeeId: rawData?.id,
        employeeCode: rawData?.username,
        department: rawData?.role?.name || "Not specified",
        designation: rawData?.role?.name || "Employee",

        // Permissions - EmployeePermissionsOwned से लें
        permissions:
          rawData?.EmployeePermissionsOwned?.map((item) => item.permission) ||
          [],

        permissionsData: rawData?.EmployeePermissionsOwned || [],

        // Wallet information (empty for employees)
        wallets: [],
      };
    } else {
      // For business users - SIMPLE FORMAT like employees
      return {
        // Common fields
        id: rawData?.id,
        firstName: rawData?.firstName,
        lastName: rawData?.lastName,
        username: rawData?.username,
        email: rawData?.email,
        phoneNumber: rawData?.phoneNumber,
        profileImage: rawData?.profileImage,
        status: rawData?.status,
        isKycVerified: rawData?.isKycVerified,
        isAuthorized: rawData?.isAuthorized,
        hierarchyLevel: rawData?.hierarchyLevel,
        hierarchyPath: rawData?.hierarchyPath,
        parentId: rawData?.parentId,
        parent: rawData?.parent,
        children: rawData?.children,
        createdAt: rawData?.createdAt,
        updatedAt: rawData?.updatedAt,
        emailVerifiedAt: rawData?.emailVerifiedAt,
        deletedAt: rawData?.deletedAt,
        deactivationReason: rawData?.deactivationReason,

        // Security fields
        password: rawData?.password,
        transactionPin: rawData?.transactionPin,

        // Role information
        role: rawData?.role,

        // Wallet information
        wallets: rawData?.wallets || [],

        // KYC information
        kycInfo: rawData?.kycInfo,

        // Bank information
        bankInfo: rawData?.bankInfo,

        // FIXED: Business user permissions - SIMPLE FORMAT like employees
        permissions:
          rawData?.userPermissions?.map(
            (perm) =>
              `${perm?.service?.name}${perm?.canView ? "_VIEW" : ""}${
                perm?.canEdit ? "_EDIT" : ""
              }${perm?.canSetCommission ? "_COMMISSION" : ""}${
                perm?.canProcess ? "_PROCESS" : ""
              }`
          ) || [],

        permissionsData: rawData?.userPermissions || [],
      };
    }
  };

  const adaptedUser = adaptUserData(userData);

  // --- Utility Functions ---
  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Invalid Date";
    }
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // --- Status Badge Component ---
  const StatusBadge = ({ status }) => {
    const colors = {
      ACTIVE: "bg-green-100 text-green-700 border-green-300",
      INACTIVE: "bg-red-100 text-red-700 border-red-300",
      PENDING: "bg-yellow-100 text-yellow-700 border-yellow-300",
      IN_ACTIVE: "bg-red-100 text-red-700 border-red-300",
      SUSPENDED: "bg-orange-100 text-orange-700 border-orange-300",
      DELETE: "bg-red-100 text-red-700 border-red-300",
    };
    const label =
      status === "IN_ACTIVE"
        ? "Inactive"
        : status === "ACTIVE"
        ? "Active"
        : status === "SUSPENDED"
        ? "Suspended"
        : status === "DELETE"
        ? "Deleted"
        : status;
    const Icon = status === "ACTIVE" ? CheckCircle : XCircle;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border transition-all duration-200 ${
          colors[status] || colors.PENDING
        }`}
      >
        <Icon size={14} />
        {label}
      </span>
    );
  };

  // --- Permission Badge Component ---
  const PermissionBadge = ({ permission }) => (
    <span className="inline-flex px-2 py-1 rounded text-xs bg-green-100 text-green-800 border border-green-300 font-medium">
      {permission.toUpperCase()}
    </span>
  );

  // --- New Stat Card Component ---
  const StatCard = ({
    icon: Icon,
    title,
    value,
    color = "cyan",
    subText = null,
  }) => (
    <div
      className={`p-4 bg-${color}-50 border border-${color}-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300`}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-gray-500 uppercase">{title}</h4>
        <Icon size={18} className={`text-${color}-600`} />
      </div>
      <p className="text-gray-900 mt-1 font-bold text-xl truncate">{value}</p>
      {subText && <p className="text-xs text-gray-500 mt-1">{subText}</p>}
    </div>
  );

  // --- Styling variables
  const detailCard =
    "bg-white rounded-xl shadow-lg border border-gray-100 p-6 w-full transition-all duration-300 hover:shadow-xl";
  const sectionTitleClass =
    "text-xl font-extrabold text-gray-800 mb-4 border-b-2 border-cyan-100 pb-2 flex items-center gap-2";

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <XCircle className="text-red-500 mx-auto mb-4" size={48} />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Business User Permissions Section
  const BusinessPermissionsSection = () => {
    if (isEmployee || !isAdminUser) return null;

    const permissions = adaptedUser?.permissions || [];

    return (
      <div className={detailCard + " p-6 bg-white shadow-lg rounded-xl"}>
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
          <h3
            className={
              sectionTitleClass +
              " flex items-center text-xl font-semibold text-gray-800"
            }
          >
            <Key className="text-cyan-600 mr-2" size={24} />
            Business User Permissions
          </h3>
        </div>

        {permissions?.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-base text-gray-600">
                Total permissions assigned to this user:
              </p>
              <span className="inline-flex px-4 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-base font-bold border border-cyan-200 shadow-sm">
                {permissions?.length} Permission
                {permissions?.length > 1 ? "s" : ""}
              </span>
            </div>

            <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
              Assigned Permissions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {permissions?.map((permission, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm transition-all hover:bg-cyan-50 hover:border-cyan-300"
                >
                  <PermissionBadge permission={permission} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 px-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
            <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-xl font-semibold text-gray-800 mb-2">
              No Permissions Assigned
            </h4>
            <p className="text-gray-500 text-base max-w-sm mx-auto">
              This business user currently has no specific permissions. Assign
              permissions to define their access.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Employee-specific fields
  const EmployeeSpecificInfo = () => {
    if (!isEmployee) return null;

    return (
      <div className={detailCard}>
        <h3 className={sectionTitleClass}>
          <Building className="text-cyan-500" size={24} /> Employee Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {adaptedUser?.employeeId && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="text-xs font-medium text-gray-500 uppercase">
                Employee ID
              </label>
              <p className="text-gray-900 mt-1 font-mono text-sm font-semibold">
                {adaptedUser?.employeeId}
              </p>
            </div>
          )}
          {adaptedUser?.employeeCode && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="text-xs font-medium text-gray-500 uppercase">
                Employee Code
              </label>
              <p className="text-gray-900 mt-1 font-mono text-sm font-semibold">
                {adaptedUser?.employeeCode}
              </p>
            </div>
          )}
          {adaptedUser?.department && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="text-xs font-medium text-gray-500 uppercase">
                Department
              </label>
              <p className="text-gray-900 mt-1 font-semibold text-base">
                {adaptedUser?.department}
              </p>
            </div>
          )}
          {adaptedUser?.designation && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <label className="text-xs font-medium text-gray-500 uppercase">
                Designation
              </label>
              <p className="text-gray-900 mt-1 font-semibold text-base">
                {adaptedUser?.designation}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Employee Permissions Section
  const EmployeePermissionsSection = () => {
    if (!isEmployee || !isAdminUser) return null;

    const permissions = adaptedUser?.permissions || [];

    return (
      <div className={detailCard + " p-6 bg-white shadow-lg rounded-xl"}>
        <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4">
          <h3
            className={
              sectionTitleClass +
              " flex items-center text-xl font-semibold text-gray-800"
            }
          >
            <Key className="text-cyan-600 mr-2" size={24} />
            Employee Permissions
          </h3>
        </div>

        {permissions?.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-5">
              <p className="text-base text-gray-600">
                Total permissions assigned to this employee:
              </p>
              <span className="inline-flex px-4 py-1.5 bg-cyan-50 text-cyan-700 rounded-full text-base font-bold border border-cyan-200 shadow-sm">
                {permissions?.length} Permission
                {permissions?.length > 1 ? "s" : ""}
              </span>
            </div>

            <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">
              Assigned Permissions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {permissions?.map((permission, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-3 rounded-lg border border-gray-200 shadow-sm transition-all hover:bg-cyan-50 hover:border-cyan-300"
                >
                  <PermissionBadge permission={permission} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-10 px-6 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50">
            <Key className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h4 className="text-xl font-semibold text-gray-800 mb-2">
              No Permissions Assigned
            </h4>
            <p className="text-gray-500 text-base max-w-sm mx-auto">
              This employee currently has no specific permissions. Assign roles
              or permissions to define their access.
            </p>
          </div>
        )}
      </div>
    );
  };

  // Deactivation/Deletion Info
  const DeactivationInfo = () => {
    if (!adaptedUser?.deletedAt && !adaptedUser?.deactivationReason)
      return null;

    return (
      <div className={detailCard}>
        <h3 className={sectionTitleClass}>
          <XCircle className="text-red-500" size={24} /> Account Status
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {adaptedUser?.deletedAt && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <label className="text-xs font-medium text-gray-500 uppercase">
                Deleted At
              </label>
              <p className="text-gray-900 mt-1 font-semibold text-base">
                {formatDate(adaptedUser?.deletedAt)}
              </p>
            </div>
          )}
          {adaptedUser?.deactivationReason && (
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <label className="text-xs font-medium text-gray-500 uppercase">
                Reason
              </label>
              <p className="text-gray-900 mt-1 font-semibold text-base">
                {adaptedUser?.deactivationReason}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Main Pop-up Structure ---
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 overflow-y-auto p-4">
      {/* Centered Modal Container */}
      <div className="relative bg-white rounded-3xl shadow-2xl my-8 max-w-5xl w-full transform transition-all duration-500 scale-100 opacity-100 animate-in fade-in zoom-in">
        {/* Sticky Header with Close Button */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 rounded-t-3xl p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            {isEmployee ? (
              <Building className="text-cyan-500" size={24} />
            ) : (
              <UserCheck className="text-cyan-500" size={24} />
            )}
            {userTypeLabel} Profile Detail
          </h1>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white hover:bg-red-500 p-2 rounded-full transition-all duration-200"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 md:p-8 space-y-8 max-h-[85vh] overflow-y-auto">
          {/* Profile Overview - Main Card */}
          <div className="bg-gradient-to-r from-cyan-50 to-purple-50 rounded-2xl shadow-xl p-6 lg:p-8 relative border-4 border-cyan-200/50">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Image & Level Badge */}
              <div className="relative flex-shrink-0">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-gray-300 flex items-center justify-center border-4 border-white shadow-2xl">
                  {adaptedUser?.profileImage ? (
                    <img
                      src={adaptedUser?.profileImage}
                      alt={`${adaptedUser?.firstName} ${adaptedUser?.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-600" />
                  )}
                </div>
                <div className="absolute bottom-0 right-0 transform translate-x-1/4 translate-y-1/4 bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg border-2 border-white">
                  {isEmployee ? "Emp" : "Lvl"}{" "}
                  {adaptedUser?.hierarchyLevel || "N/A"}
                </div>
              </div>

              {/* Name & Badges */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-1 leading-tight">
                  {adaptedUser?.firstName} {adaptedUser?.lastName}
                </h2>
                <p className="text-purple-600 text-xl font-mono mb-4">
                  @{adaptedUser?.username}
                  {isEmployee && adaptedUser?.employeeCode && (
                    <span className="text-gray-500 ml-2">
                      ({adaptedUser?.employeeCode})
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                  <StatusBadge status={adaptedUser?.status} />

                  {adaptedUser?.isKycVerified ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold border border-blue-300 transition-all duration-200 hover:bg-blue-200">
                      <CheckCircle size={14} /> KYC Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold border border-gray-300 transition-all duration-200 hover:bg-gray-200">
                      <XCircle size={14} /> KYC Not Verified
                    </span>
                  )}

                  {adaptedUser?.emailVerifiedAt ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold border border-green-300 transition-all duration-200 hover:bg-green-200">
                      <CheckCircle size={14} /> Email Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm font-semibold border border-gray-300 transition-all duration-200 hover:bg-gray-200">
                      <XCircle size={14} /> Email Not Verified
                    </span>
                  )}

                  {isEmployee ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold border border-green-300 transition-all duration-200 hover:bg-green-200">
                      <Building size={14} /> Employee
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold border border-green-300 transition-all duration-200 hover:bg-green-200">
                      <UserCheck size={14} /> Business User
                    </span>
                  )}

                  {/* Permissions Count Badge */}
                  {isAdminUser && adaptedUser?.permissions && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold border border-orange-300 transition-all duration-200 hover:bg-orange-200">
                      <Key size={14} /> {adaptedUser?.permissions?.length}{" "}
                      Permissions
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Deactivation Info */}
          <DeactivationInfo />

          {/* Type Specific Info */}
          {isEmployee && <EmployeeSpecificInfo />}

          {/* Permissions Section */}
          {isEmployee ? (
            <EmployeePermissionsSection />
          ) : (
            <BusinessPermissionsSection />
          )}

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {!isEmployee && adaptedUser?.wallets?.[0] && (
              <StatCard
                icon={Wallet}
                title="Current Balance"
                value={formatCurrency(adaptedUser?.wallets?.[0]?.balance || 0)}
                color="green"
                subText={`Available: ${formatCurrency(
                  adaptedUser?.wallets?.[0]?.availableBalance || 0
                )}`}
              />
            )}
            <StatCard
              icon={Users}
              title="Direct Children"
              value={adaptedUser?.children?.length || 0}
              color="purple"
              subText="View list below"
            />

            <StatCard
              icon={Briefcase}
              title={isEmployee ? "Designation" : "Role Level"}
              value={
                isEmployee
                  ? adaptedUser?.designation ||
                    adaptedUser?.role?.level ||
                    "N/A"
                  : adaptedUser?.role?.level || "N/A"
              }
              color="orange"
            />
            <StatCard
              icon={Calendar}
              title="Member Since"
              value={
                adaptedUser?.createdAt
                  ? new Date(adaptedUser?.createdAt).getFullYear()
                  : "N/A"
              }
              color="blue"
              subText={
                adaptedUser?.createdAt
                  ? new Date(adaptedUser?.createdAt).toLocaleDateString()
                  : "N/A"
              }
            />
          </div>

          {/* Detailed Information Grid: 2/3 (Left) and 1/3 (Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Main Content Column (2/3) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info & IDs */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <User className="text-cyan-500" size={24} /> General Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* User ID */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="text-xs font-medium text-gray-500 uppercase flex items-center gap-1">
                      <Hash size={14} /> Unique {userTypeLabel} ID
                    </label>
                    <p className="text-gray-900 mt-1 font-mono text-sm break-all font-semibold">
                      {adaptedUser?.id}
                    </p>
                  </div>
                  {/* Username */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Username
                    </label>
                    <p className="text-gray-900 mt-1 font-semibold text-lg">
                      @{adaptedUser?.username}
                    </p>
                  </div>
                  {/* First Name */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      First Name
                    </label>
                    <p className="text-gray-900 mt-1 font-semibold text-base">
                      {adaptedUser?.firstName}
                    </p>
                  </div>
                  {/* Last Name */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Last Name
                    </label>
                    <p className="text-gray-900 mt-1 font-semibold text-base">
                      {adaptedUser?.lastName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <Mail className="text-cyan-500" size={24} /> Contact
                  Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="text-white" size={18} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500">
                        Email Address
                      </label>
                      <p className="text-gray-900 font-semibold text-base break-all">
                        {adaptedUser?.email}
                      </p>
                      <span
                        className={`text-xs font-semibold flex items-center gap-1 mt-0.5 ${
                          adaptedUser?.emailVerifiedAt
                            ? "text-green-600"
                            : "text-orange-600"
                        }`}
                      >
                        {adaptedUser?.emailVerifiedAt ? (
                          <CheckCircle size={12} />
                        ) : (
                          <XCircle size={12} />
                        )}
                        {adaptedUser?.emailVerifiedAt
                          ? "Verified"
                          : "Not verified"}
                      </span>
                    </div>
                  </div>
                  {/* Phone */}
                  <div className="flex items-start gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="text-white" size={18} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-500">
                        Phone Number
                      </label>
                      <p className="text-gray-900 font-semibold text-base">
                        {adaptedUser?.phoneNumber || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Info */}
              {isAdminUser && (
                <div className={detailCard}>
                  <h3 className={sectionTitleClass}>
                    <Lock className="text-cyan-500" size={24} /> Security
                    Credentials
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Password Hash */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-cyan-400 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-500 uppercase">
                          Password Hash
                        </label>
                        <button
                          onClick={() => setShowPassword((s) => !s)}
                          className="text-cyan-600 hover:text-cyan-700 flex items-center gap-1 text-sm font-medium transition-colors"
                          aria-label="Toggle password visibility"
                        >
                          {showPassword ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                          {showPassword ? "Hide Hash" : "Show Hash"}
                        </button>
                      </div>
                      <p className="text-gray-900 font-mono text-xs break-all cursor-text select-all">
                        {showPassword
                          ? adaptedUser?.password || "N/A"
                          : "•••••••"}
                      </p>
                    </div>
                    {/* Transaction PIN Hash */}
                    {!isEmployee && (
                      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-cyan-400 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-gray-500 uppercase">
                            Transaction PIN Hash
                          </label>
                          <button
                            onClick={() => setShowTransactionPin((s) => !s)}
                            className="text-cyan-600 hover:text-cyan-700 flex items-center gap-1 text-sm font-medium transition-colors"
                            aria-label="Toggle transaction pin visibility"
                          >
                            {showTransactionPin ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                            {showTransactionPin ? "Hide Hash" : "Show Hash"}
                          </button>
                        </div>
                        <p className="text-gray-900 font-mono text-xs break-all cursor-text select-all">
                          {showTransactionPin
                            ? adaptedUser?.transactionPin || "N/A"
                            : "•••••••"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar Column (1/3) */}
            <div className="lg:col-span-1 space-y-6">
              {/* Hierarchy Info */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <TrendingUp className="text-cyan-500" size={24} /> Hierarchy
                </h3>
                <div className="space-y-4">
                  {/* Parent */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Parent User
                    </label>
                    <div className="mt-1 flex items-center gap-3 p-3 bg-cyan-50 rounded-lg border border-cyan-200">
                      <Users className="text-cyan-600" size={20} />
                      <div>
                        <p className="text-gray-900 font-semibold text-base">
                          @{adaptedUser?.parent?.username || "N/A"}
                        </p>
                        <p className="text-gray-600 text-xs font-mono">
                          ID: {adaptedUser?.parentId || "No parent ID"}
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Path */}
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Hierarchy Path
                    </label>
                    <p className="text-gray-900 mt-1 font-mono text-xs bg-gray-50 px-3 py-2 rounded-lg break-all border border-gray-200 max-h-24 overflow-y-auto">
                      {adaptedUser?.hierarchyPath || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Role Info */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <Shield className="text-cyan-500" size={24} />{" "}
                  {isEmployee ? "Employee" : "Role"} Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      {isEmployee ? "Designation" : "Role Name"}
                    </label>
                    <p className="text-gray-900 mt-1 font-bold text-lg p-2 bg-purple-50 rounded-md border border-purple-200">
                      {isEmployee
                        ? adaptedUser?.designation ||
                          adaptedUser?.role?.name ||
                          "N/A"
                        : adaptedUser?.role?.name || "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      {isEmployee ? "Department" : "Role ID"}
                    </label>
                    <p className="text-gray-900 mt-1 font-mono text-sm bg-gray-50 px-3 py-2 rounded-lg break-all border border-gray-200">
                      {isEmployee
                        ? adaptedUser?.department || "N/A"
                        : adaptedUser?.role?.id || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Timestamps */}
              <div className={detailCard}>
                <h3 className={sectionTitleClass}>
                  <Calendar className="text-cyan-500" size={24} /> Timestamps
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Created At
                    </label>
                    <p className="text-gray-900 mt-1 text-sm font-medium">
                      {formatDate(adaptedUser?.createdAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">
                      Last Updated
                    </label>
                    <p className="text-gray-900 mt-1 text-sm font-medium">
                      {formatDate(adaptedUser?.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Children List - Full Width Section */}
          {adaptedUser?.children && adaptedUser?.children.length > 0 && (
            <div className={detailCard}>
              <h3 className={sectionTitleClass}>
                <Users className="text-cyan-500" size={24} /> Direct{" "}
                {isEmployee ? "Team Members" : "Children"} (
                {adaptedUser?.children.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {adaptedUser?.children.map((child) => (
                  <div
                    key={child.id}
                    className="p-4 border rounded-xl bg-cyan-50 hover:bg-cyan-100 transition-colors duration-200 shadow-sm"
                  >
                    <p className="font-bold text-gray-900 text-lg mb-1">
                      @{child.username}
                    </p>
                    <p className="text-sm text-gray-700">
                      {child.firstName} {child.lastName}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Mail size={12} /> {child.email}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
