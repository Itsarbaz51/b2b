// AddEmployeePermissions.js
import { useState, useEffect, useCallback } from "react";

const AddEmployeePermissions = ({
  mode,
  onSubmit,
  onCancel,
  selectedUser,
  existingPermissions = [],
  isLoading = false,
  type, // "user" or "role"
}) => {
  const [permissions, setPermissions] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Safe permissions extraction from API response
  const safePermissions = useCallback(() => {
    if (!existingPermissions || !Array.isArray(existingPermissions)) return [];

    if (type === "user") {
      // For user type: EmployeePermissionsOwned structure
      return existingPermissions
        .filter((perm) => perm.isActive && perm.permission)
        .map((perm) => perm.permission);
    } else {
      // For role type: different structure (adjust based on your actual role permissions structure)
      return existingPermissions
        .filter((perm) => perm.isActive && (perm.permission || perm.name))
        .map((perm) => perm.permission || perm.name);
    }
  }, [existingPermissions, type]);

  // Common permission suggestions
  const COMMON_PERMISSIONS = [
    "dashboard",
    "transactions",
    "commission",
    "reports",
    "kyc request",
    "members",
    "General Settings",
    "Company Accounts",
    "Services",
    "Roles Management",
    "API Integration",
    "profile",
    "logs",
    "employee management",
  ];

  const MAX_PERMISSIONS = 20;

  useEffect(() => {
    setPermissions(safePermissions());
  }, [safePermissions]);

  const handleAddPermission = (permission) => {
    if (permissions.length >= MAX_PERMISSIONS) {
      setError(`Maximum ${MAX_PERMISSIONS} permissions allowed`);
      return;
    }

    if (!permissions.includes(permission)) {
      setPermissions((prev) => [...prev, permission]);
      setError("");
    }
  };

  const handleRemovePermission = (permission) => {
    setPermissions((prev) => prev.filter((p) => p !== permission));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(permissions);
    } catch (err) {
      setError(err.message || "Failed to update permissions");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPermissionDisabled = (permission) =>
    permissions.includes(permission) ||
    permissions.length >= MAX_PERMISSIONS ||
    isSubmitting;

  // Get display data based on type
  const getDisplayData = () => {
    if (type === "user") {
      return {
        title:
          mode === "add"
            ? "Add Employee Permissions"
            : "Edit Employee Permissions",
        name: `${selectedUser?.firstName || ""} ${
          selectedUser?.lastName || ""
        }`.trim(),
        email: selectedUser?.email,
        phone: selectedUser?.phoneNumber,
        identifier: selectedUser?.id,
        identifierLabel: "User ID",
      };
    } else {
      return {
        title:
          mode === "add" ? "Add Role Permissions" : "Edit Role Permissions",
        name: selectedUser?.name || selectedUser?.roleName || "Unknown Role",
        email: null, // Roles don't have email
        phone: null, // Roles don't have phone
        identifier: selectedUser?.id,
        identifierLabel: "Role ID",
      };
    }
  };

  const displayData = getDisplayData();

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {displayData.title}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              disabled={isSubmitting}
              type="button"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Information Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {type === "user" ? "Employee" : "Role"}
              </label>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                <div className="text-sm font-medium text-gray-900">
                  {displayData.name}
                </div>
                {displayData.email && (
                  <div className="text-xs text-gray-600 mt-1">
                    {displayData.email}{" "}
                    {displayData.phone && `• ${displayData.phone}`}
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {displayData.identifierLabel}: {displayData.identifier}
                </div>
                {type === "role" && selectedUser?.description && (
                  <div className="text-xs text-gray-500 mt-1">
                    Description: {selectedUser.description}
                  </div>
                )}
              </div>
            </div>

            {/* Permissions Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Permissions
                <span className="text-xs text-gray-500 ml-2">
                  (Max {MAX_PERMISSIONS} permissions allowed)
                </span>
              </label>

              {permissions.length > 0 ? (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Selected Permissions ({permissions.length}):
                  </label>
                  <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-md">
                    {permissions.map((permission, index) => (
                      <span
                        key={`${permission}-${index}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-300"
                      >
                        {permission.toUpperCase()}
                        <button
                          type="button"
                          onClick={() => handleRemovePermission(permission)}
                          className="ml-2 text-blue-600 hover:text-blue-800 transition-colors disabled:opacity-50"
                          disabled={isSubmitting}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-md text-center">
                  <p className="text-sm text-gray-500">
                    No permissions selected
                  </p>
                </div>
              )}

              {permissions.length >= MAX_PERMISSIONS && (
                <div className="text-xs text-red-500 mt-1">
                  Maximum {MAX_PERMISSIONS} permissions reached
                </div>
              )}
            </div>

            {/* Common Permissions Suggestions */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Click to add permissions:
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_PERMISSIONS.map((commonPermission) => (
                  <button
                    key={commonPermission}
                    type="button"
                    onClick={() => handleAddPermission(commonPermission)}
                    disabled={isPermissionDisabled(commonPermission)}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      isPermissionDisabled(commonPermission)
                        ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                        : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {commonPermission.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 flex items-center justify-center transition-colors"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : mode === "add" ? (
                  "Add Permissions"
                ) : (
                  "Update Permissions"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEmployeePermissions;
