// RoleManager.js
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
import { RoleList } from "./tabels/RoleList";
import { RoleFormModal } from "./forms/RoleForm";
import {
  createRole,
  deleteRole,
  updateRole,
  getAllRolesByType,
  clearRoleError,
  clearRoleSuccess,
} from "../redux/slices/roleSlice";
import AddEmployeePermissions from "./forms/AddEmployeePermissions";
import {
  getPermissionRoleById,
  upsertRolePermission,
} from "../redux/slices/permissionSlice";
import { allServices } from "../redux/slices/serviceSlice";

export default function RoleManager() {
  const dispatch = useDispatch();

  // Use correct selectors based on active tab
  const rolesState = useSelector((state) => state.roles);
  const {
    roles = [],
    businessRoles = [],
    employeeRoles = [],
    isLoading,
    error,
    success,
  } = rolesState;

  const services =
    useSelector((state) => state.services?.serviceProviders?.allActiveServices) ||
    [];
  const { currentPermission } = useSelector((state) => state.permission);

  const [editRole, setEditRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("employee");

  // Permission Modal States
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionRole, setPermissionRole] = useState(null);
  const [existingPermissions, setExistingPermissions] = useState(null);
  const [permissionMode, setPermissionMode] = useState("role");

  // Fetch roles when component mounts and when tab changes
  useEffect(() => {
    const roleType = activeTab === "employee" ? "employee" : "business";
    dispatch(getAllRolesByType(roleType));
  }, [dispatch, activeTab]);

  useEffect(() => {
    if (showPermissionModal) {
      dispatch(allServices("active"));
    }
  }, [showPermissionModal, dispatch]);

  // Clear errors/success messages when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearRoleError());
      dispatch(clearRoleSuccess());
    };
  }, [dispatch]);

  // Auto-clear success message after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        dispatch(clearRoleSuccess());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  // Auto-clear error message after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearRoleError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (
      currentPermission &&
      permissionRole &&
      (currentPermission.roleId === permissionRole.id ||
        currentPermission.userId === permissionRole.id)
    ) {
      setExistingPermissions(currentPermission);
    } else {
      setExistingPermissions(null);
    }
  }, [currentPermission, permissionRole]);

  useEffect(() => {
    if (showPermissionModal && permissionRole?.id) {
      dispatch(getPermissionRoleById(permissionRole.id));
    }
  }, [dispatch, showPermissionModal, permissionRole]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    dispatch(clearRoleError());
    dispatch(clearRoleSuccess());
  };

  const handleAddOrUpdate = async (roleData) => {
    try {
      // For both create and update, only send name and description
      // Backend handles type, level, and createdBy automatically
      const submitData = {
        name: roleData.name,
        description: roleData.description,
        type: "employee", // Force type to employee as per backend
      };

      if (editRole) {
        await dispatch(updateRole(editRole.id, submitData));
        setEditRole(null);
      } else {
        await dispatch(createRole(submitData));
      }
      setIsModalOpen(false);

      // Refresh the correct role list
      const roleType = activeTab === "employee" ? "employee" : "business";
      dispatch(getAllRolesByType(roleType));
    } catch (error) {
      console.error("Operation failed:", error);
    }
  };

  const handleEdit = (role) => {
    // Only allow editing for employee roles
    if (activeTab === "employee") {
      setEditRole(role);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (role) => {
    // Only allow deleting for employee roles
    if (activeTab === "employee") {
      if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
        try {
          await dispatch(deleteRole(role.id));
          // Refresh the correct role list
          const roleType = activeTab === "employee" ? "employee" : "business";
          dispatch(getAllRolesByType(roleType));
        } catch (error) {
          console.error("Delete failed:", error);
        }
      }
    }
  };

  // const handlePermission = (role) => {
  //   setPermissionRole(role);
  //   setShowPermissionModal(true);
  //   setPermissionMode("role");
  //   setExistingPermissions(null);

  //   if (role.id) {
  //     dispatch(getPermissionRoleById(role.id));
  //   }
  // };

  // const handlePermissionSubmit = async (permissionData) => {
  //   try {
  //     await dispatch(upsertRolePermission(permissionData));
  //     handleClosePermissionModal();
  //     // Refresh the correct role list
  //     const roleType = activeTab === "employee" ? "employee" : "business";
  //     dispatch(getAllRolesByType(roleType));
  //   } catch (error) {
  //     console.error("Permission update failed:", error);
  //   }
  // };

  // const handleClosePermissionModal = () => {
  //   setShowPermissionModal(false);
  //   setPermissionRole(null);
  //   setExistingPermissions(null);
  //   setPermissionMode("role");
  // };

  const handleCancel = () => {
    setEditRole(null);
    setIsModalOpen(false);
    dispatch(clearRoleError());
  };

  const handleAddNew = () => {
    setEditRole(null);
    setIsModalOpen(true);
  };

  // Use the correct roles based on active tab
  const getFilteredRoles = () => {
    if (activeTab === "employee") {
      return employeeRoles;
    } else {
      return businessRoles;
    }
  };

  const filteredRoles = getFilteredRoles();

  return (
    <div className="bg-white rounded-xl border border-gray-300 p-6 shadow-sm">
      {/* Header with gradient background */}
      <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 rounded-xl p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {activeTab === "employee" ? "Employee Roles" : "Business Roles"}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Manage and monitor your{" "}
              {activeTab === "employee" ? "employee" : "business"} roles
            </p>
          </div>

          {activeTab === "employee" && (
            <button
              onClick={handleAddNew}
              disabled={isLoading}
              className="flex items-center gap-2 px-6 py-2.5 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/30 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed border border-white/30"
            >
              <Plus size={20} />
              {isLoading ? "Loading..." : "Create Employee Role"}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-4">
          <nav className="flex space-x-4">
            <button
              onClick={() => handleTabChange("employee")}
              className={`py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                activeTab === "employee"
                  ? "bg-white text-cyan-700 shadow-sm"
                  : "text-white/80 hover:text-white hover:bg-white/20"
              }`}
            >
              Employee Roles
            </button>
            <button
              onClick={() => handleTabChange("business")}
              className={`py-2 px-4 rounded-lg font-medium text-sm transition-colors ${
                activeTab === "business"
                  ? "bg-white text-cyan-700 shadow-sm"
                  : "text-white/80 hover:text-white hover:bg-white/20"
              }`}
            >
              Business Roles
            </button>
          </nav>
        </div>
      </div>

      {isLoading && !filteredRoles.length && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">
            Loading {activeTab === "employee" ? "employee" : "business"}{" "}
            roles...
          </p>
        </div>
      )}

      {error && !isLoading && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <p className="text-green-700 text-sm font-medium">{success}</p>
        </div>
      )}

      {!isLoading && filteredRoles.length > 0 && (
        <RoleList
          roles={filteredRoles}
          onEdit={handleEdit}
          onDelete={handleDelete}
          // onPermission={handlePermission}
          type={activeTab}
        />
      )}

      {!isLoading && filteredRoles.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <div className="text-gray-400 mb-4">
            <Plus size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {activeTab === "employee" ? "employee" : "business"} roles found
          </h3>
          <p className="text-gray-600 mb-4">
            {activeTab === "employee"
              ? "Get started by creating your first employee role."
              : "Business roles are managed automatically."}
          </p>
          {activeTab === "employee" && (
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              Create Employee Role
            </button>
          )}
        </div>
      )}

      <RoleFormModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        onSubmit={handleAddOrUpdate}
        editData={editRole}
        isLoading={isLoading}
        type={activeTab}
      />

      {showPermissionModal && permissionRole && (
        <AddEmployeePermissions
          mode={permissionMode}
          onSubmit={handlePermissionSubmit}
          onCancel={handleClosePermissionModal}
          selectedUser={permissionRole}
          type={"role"}
          existingPermissions={existingPermissions}
          isLoading={isLoading}
        />
      )}
    </div>
  );
}
