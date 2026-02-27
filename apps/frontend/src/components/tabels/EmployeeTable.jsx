// EmployeeTable.js
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Search,
  Phone,
  Mail,
  X,
  MoreVertical,
  Eye,
  EyeOff,
  RefreshCw,
  UsersRound,
  Filter,
  UserPlus,
} from "lucide-react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import AddMember from "../forms/AddMember";
import {
  getAllEmployeesByParentId,
  deactivateEmployee,
  reactivateEmployee,
  deleteEmployee,
  updateEmployeePermissions,
  clearEmployeeError,
  clearEmployeeSuccess,
} from "../../redux/slices/employeeSlice";

import ButtonField from "../ui/ButtonField";
import ConfirmCard from "../ui/ConfirmCard";
import Pagination from "../ui/Pagination";
import EmptyState from "../ui/EmptyState";
import ActionsMenu from "../ui/ActionsMenu";
import UserProfileView from "../../pages/view/UserProfileView";
import EditCredentialsModal from "../forms/EditCredentialsModal";
import EditProfileImageModal from "../forms/EditProfileImageModal";
import { login } from "../../redux/slices/authSlice";
import PageHeader from "../ui/PageHeader";
import AddEmployeePermissions from "../forms/AddEmployeePermissions";

const EmployeeTable = () => {
  const dispatch = useDispatch();
  const { employees, isLoading, pagination, error, success } = useSelector(
    (state) => state.employees
  );
  const currentUser = useSelector((state) => state.auth.currentUser);

  // State management
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [actionType, setActionType] = useState("");

  // Modal states
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionUser, setPermissionUser] = useState(null);
  const [permissionMode, setPermissionMode] = useState("add");

  // Derived values
  const currentUserRole = currentUser?.role?.name || "";
  const isAdminUser = currentUserRole === "ADMIN";
  const isEmployee = currentUser?.role?.type === "employee";
  const totalPages = pagination?.totalPages || 0;
  const totalEmployees = pagination?.total || 0;

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    if (!search) return employees;

    const searchLower = search.toLowerCase();
    return employees.filter(
      (employee) =>
        employee.firstName?.toLowerCase().includes(searchLower) ||
        employee.lastName?.toLowerCase().includes(searchLower) ||
        employee.email?.toLowerCase().includes(searchLower) ||
        employee.username?.toLowerCase().includes(searchLower) ||
        employee.phoneNumber?.includes(search)
    );
  }, [employees, search]);

  // Load employees on component mount and page change
  useEffect(() => {
    loadEmployees();
  }, [currentPage, limit]);

  // Handle success/error messages
  useEffect(() => {
    if (success) {
      toast.success(success);
      dispatch(clearEmployeeSuccess());
    }
    if (error) {
      toast.error(error);
      dispatch(clearEmployeeError());
    }
  }, [success, error, dispatch]);

  const loadEmployees = useCallback(() => {
    dispatch(
      getAllEmployeesByParentId({
        page: currentPage,
        limit,
        search: search || undefined,
      })
    );
  }, [dispatch, currentPage, limit, search]);

  const handleManualRefresh = () => {
    loadEmployees();
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const togglePasswordVisibility = (employeeId) => {
    setShowPasswords((prev) => ({
      ...prev,
      [employeeId]: !prev[employeeId],
    }));
  };

  // FIXED: Added setSelectedUser to handleViewUser
  const handleViewUser = (employee) => {
    setSelectedUser(employee); // This line was missing
    setShowViewProfile(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedUser(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    loadEmployees();
  };

  const handleEditProfileSuccess = () => {
    setShowEditProfile(false);
    setSelectedUser(null);
    loadEmployees();
  };

  const handleCredentialsSuccess = () => {
    setShowEditPassword(false);
    setSelectedUser(null);
  };

  const handleAddPermission = (employee) => {
    setPermissionUser(employee);
    setPermissionMode("add");
    setShowPermissionModal(true);
  };

  const handleEditPermission = (employee) => {
    setPermissionUser(employee);
    setPermissionMode("edit");
    setShowPermissionModal(true);
  };

  const handlePermissionSubmit = async (permissions) => {
    if (!permissionUser) return;

    try {
      await dispatch(updateEmployeePermissions(permissionUser.id, permissions));
      setShowPermissionModal(false);
      setPermissionUser(null);
      loadEmployees();
    } catch (error) {
      toast.error("Failed to update permissions");
    }
  };

  const handleClosePermissionModal = () => {
    setShowPermissionModal(false);
    setPermissionUser(null);
  };

  const handleLogin = async (employee) => {
    const payload = {
      emailOrUsername: employee.username.trim(),
      password: employee.password.trim(),
    };

    try {
      await dispatch(login(payload));
      toast.success(`Logged in as ${employee.firstName || employee.username}`);
    } catch (error) {
      console.error("Login failed:", error);
      toast.error("Login failed");
    }
  };

  const confirmAction = async (reason) => {
    if (!selectedUser) return;

    try {
      switch (actionType) {
        case "Activate":
          await dispatch(
            reactivateEmployee({
              employeeId: selectedUser.id,
              reason,
            })
          );
          break;
        case "Deactivate":
          await dispatch(
            deactivateEmployee({
              employeeId: selectedUser.id,
              reason,
            })
          );
          break;
        case "Delete":
          await dispatch(
            deleteEmployee({
              employeeId: selectedUser.id,
              reason,
            })
          );
          break;
        default:
          break;
      }
      setShowActionModal(false);
      setSelectedUser(null);
      loadEmployees();
    } catch (error) {
      // Error handled by slice
    }
  };

  // Utility functions
  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-red-500",
      "bg-teal-500",
    ];
    const index = name?.charCodeAt(0) % colors.length || 0;
    return colors[index];
  };

  const getInitials = (firstName, lastName) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return `${first}${last}`.toUpperCase();
  };

  const getRoleColor = (roleName) => {
    const roleMap = {
      "STATE HEAD": "bg-purple-100 text-purple-800 border-purple-300",
      "STATE HOLDER": "bg-purple-100 text-purple-800 border-purple-300",
      "MASTER DISTRIBUTOR": "bg-blue-100 text-blue-800 border-blue-300",
      DISTRIBUTOR: "bg-green-100 text-green-800 border-green-300",
      AGENT: "bg-amber-100 text-amber-800 border-amber-300",
      RETAILER: "bg-orange-100 text-orange-800 border-orange-300",
    };
    return (
      roleMap[roleName?.toUpperCase()] ||
      "bg-gray-100 text-gray-800 border-gray-300"
    );
  };

  const getRoleDisplayName = (roleName) => {
    const roleMap = {
      "STATE HEAD": "State Head",
      "STATE HOLDER": "State Holder",
      "MASTER DISTRIBUTOR": "Master Distributor",
      DISTRIBUTOR: "Distributor",
      AGENT: "Agent",
      RETAILER: "Retailer",
    };
    return roleMap[roleName?.toUpperCase()] || roleName || "Unknown";
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      IN_ACTIVE: {
        label: "Inactive",
        class: "bg-red-100 text-red-800 border-red-300",
      },
      ACTIVE: {
        label: "Active",
        class: "bg-green-100 text-green-800 border-green-300",
      },
      DELETE: {
        label: "Deleted",
        class: "bg-gray-100 text-gray-800 border-gray-300",
      },
    };
    return (
      statusMap[status] || {
        label: status || "Unknown",
        class: "bg-yellow-100 text-yellow-800 border-yellow-300",
      }
    );
  };

  // Extract active permissions from employee data
  const getEmployeePermissions = (employee) => {
    if (!employee?.EmployeePermissionsOwned) return [];
    return employee.EmployeePermissionsOwned.filter(
      (perm) => perm.isActive
    ).map((perm) => perm.permission);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <PageHeader
          breadcrumb={["Dashboard", "Employee Management"]}
          title="Employee Management"
          description="Manage your team members and employee records"
        />
        <div className="flex gap-3 mt-4 sm:mt-0">
          <ButtonField
            name="Add Employee"
            isOpen={() => setShowForm(true)}
            icon={UserPlus}
            css
          />
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Team Employees
            </h2>
            <p className="text-gray-600">Manage and monitor your team</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search employees..."
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-gray-50 focus:bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button className="inline-flex items-center px-4 py-3 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className={`px-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2 transition-colors ${
                isLoading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900"
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-300 overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b border-gray-300">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                EMPLOYEE
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CONTACT
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ROLE
              </th>
              {(isEmployee || isAdminUser) && (
                <>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PASSWORD
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PERMISSIONS
                  </th>
                </>
              )}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                STATUS
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={isEmployee || isAdminUser ? 8 : 6}>
                  <EmptyState type="loading" />
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan={isEmployee || isAdminUser ? 8 : 6}>
                  <EmptyState
                    type={search ? "search" : "empty"}
                    search={search}
                  />
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee, index) => {
                const statusInfo = getStatusDisplay(employee.status);
                const employeePermissions = getEmployeePermissions(employee);

                return (
                  <tr
                    key={employee.id}
                    className="hover:bg-blue-50 transition-all"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(currentPage - 1) * limit + index + 1}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className={`h-10 w-10 rounded-full ${getAvatarColor(
                            employee.firstName
                          )} flex items-center justify-center text-white font-medium text-sm cursor-pointer hover:scale-105 transition-transform`}
                          onClick={() =>
                            employee.profileImage &&
                            setPreviewImage(employee.profileImage)
                          }
                        >
                          {employee.profileImage ? (
                            <img
                              src={employee.profileImage}
                              alt={employee.firstName || "Employee"}
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            getInitials(employee.firstName, employee.lastName)
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {`${employee.firstName || ""} ${
                              employee.lastName || ""
                            }`.trim()}
                          </div>
                          <div className="text-sm text-gray-500">
                            @{employee.username}
                          </div>
                          <div className="text-xs text-gray-400 flex items-center">
                            <UsersRound className="w-3 h-3 mr-1" />
                            Parent: {employee.parent?.username || ""}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {employee.email || "No email"}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <Phone className="w-4 h-4 mr-2 text-gray-400" />
                        {employee.phoneNumber || "No phone"}
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(
                          employee.role?.name
                        )}`}
                      >
                        {getRoleDisplayName(employee.role?.name)}
                      </span>
                    </td>

                    {(isEmployee || isAdminUser) && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-mono">
                              {showPasswords[employee.id]
                                ? employee.password
                                : "••••••••"}
                            </span>
                            <button
                              onClick={() =>
                                togglePasswordVisibility(employee.id)
                              }
                              className="text-gray-500 hover:text-gray-700 transition-colors"
                              title={
                                showPasswords[employee.id] ? "Hide" : "Show"
                              }
                            >
                              {showPasswords[employee.id] ? (
                                <EyeOff size={14} />
                              ) : (
                                <Eye size={14} />
                              )}
                            </button>
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap">
                          {employeePermissions.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {employeePermissions
                                .slice(0, 3)
                                .map((permission, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded border border-blue-300"
                                  >
                                    {permission.toUpperCase()}
                                  </span>
                                ))}
                              {employeePermissions.length > 3 && (
                                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded border border-gray-300">
                                  +{employeePermissions.length - 3}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">
                              No permissions
                            </span>
                          )}
                        </td>
                      </>
                    )}

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${statusInfo.class}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center relative">
                      <div className="inline-block relative">
                        <button
                          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                          onClick={() =>
                            setOpenMenuId(
                              openMenuId === employee.id ? null : employee.id
                            )
                          }
                        >
                          {openMenuId === employee.id ? (
                            <X className="w-5 h-5 text-gray-600" />
                          ) : (
                            <MoreVertical className="w-5 h-5 text-gray-600" />
                          )}
                        </button>

                        {openMenuId === employee.id && (
                          <ActionsMenu
                            type="employee"
                            user={employee}
                            isAdminUser={isEmployee || isAdminUser}
                            onView={handleViewUser}
                            onEdit={(employee) => {
                              setSelectedUser(employee);
                              setShowForm(true);
                              setOpenMenuId(null);
                            }}
                            onEditProfile={(employee) => {
                              setSelectedUser(employee);
                              setShowEditProfile(true);
                              setOpenMenuId(null);
                            }}
                            onEditPassword={(employee) => {
                              setSelectedUser(employee);
                              setShowEditPassword(true);
                              setOpenMenuId(null);
                            }}
                            onPermission={
                              employeePermissions.length > 0
                                ? handleEditPermission
                                : handleAddPermission
                            }
                            onToggleStatus={(employee) => {
                              setActionType(
                                employee.status === "IN_ACTIVE"
                                  ? "Activate"
                                  : "Deactivate"
                              );
                              setSelectedUser(employee);
                              setShowActionModal(true);
                              setOpenMenuId(null);
                            }}
                            onDelete={(employee) => {
                              setActionType("Delete");
                              setSelectedUser(employee);
                              setShowActionModal(true);
                              setOpenMenuId(null);
                            }}
                            onLogin={handleLogin}
                            onClose={() => setOpenMenuId(null)}
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-300 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {filteredEmployees.length} of {totalEmployees} employees
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Active:{" "}
              {employees.filter((emp) => emp.status === "ACTIVE").length}
            </div>
            <div className="text-sm text-gray-600">
              Inactive:{" "}
              {employees.filter((emp) => emp.status === "IN_ACTIVE").length}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {showViewProfile && selectedUser && (
        <UserProfileView
          userId={selectedUser.id}
          isAdminUser={isEmployee || isAdminUser}
          onClose={() => {
            setShowViewProfile(false);
            setSelectedUser(null);
          }}
          type="employee"
        />
      )}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-[90%] max-h-[85%]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white text-3xl font-bold hover:text-gray-300 transition-colors"
            >
              ×
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[50vh] rounded-lg shadow-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {showActionModal && (
        <ConfirmCard
          actionType={actionType}
          user={selectedUser}
          isClose={() => setShowActionModal(false)}
          isSubmit={confirmAction}
          predefinedReasons={[
            "Violation of terms of service",
            "Inappropriate behavior",
            "Security concerns",
            "User request",
            "Suspicious activity",
            "Account verification required",
            "Other",
          ]}
        />
      )}

      {showForm && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <AddMember
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
            editData={selectedUser}
            isAdmin={isEmployee || isAdminUser}
            type="employee"
          />
        </div>
      )}

      {showEditProfile && selectedUser && (
        <EditProfileImageModal
          user={selectedUser}
          onClose={() => {
            setShowEditProfile(false);
            setSelectedUser(null);
          }}
          onSuccess={handleEditProfileSuccess}
          type="employee"
        />
      )}

      {showEditPassword && selectedUser && (
        <EditCredentialsModal
          userId={selectedUser.id}
          type="password"
          onClose={() => {
            setShowEditPassword(false);
            setSelectedUser(null);
          }}
          onSuccess={handleCredentialsSuccess}
        />
      )}

      {showPermissionModal && permissionUser && (
        <AddEmployeePermissions
          mode={permissionMode}
          onSubmit={handlePermissionSubmit}
          onCancel={handleClosePermissionModal}
          selectedUser={permissionUser}
          existingPermissions={permissionUser.EmployeePermissionsOwned || []}
          isLoading={isLoading}
          type={"user"}
        />
      )}
    </div>
  );
};

export default EmployeeTable;
