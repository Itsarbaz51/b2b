import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";

import PageHeader from "../components/ui/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import { RoleTable } from "./tabels/RoleTable";
import { RoleFormModal } from "./forms/RoleForm";
import AddEmployeePermissions from "./forms/AddEmployeePermissions";

import {
  createRole,
  deleteRole,
  updateRole,
  getAllRolesByType,
  clearRoleError,
  clearRoleSuccess,
} from "../redux/slices/roleSlice";

import {
  getPermissionRoleById,
  upsertRolePermission,
} from "../redux/slices/permissionSlice";

import { getAllServices } from "../redux/slices/serviceSlice";
import AddUserPermission from "./forms/AddUserPermission";

export default function RoleManager() {
  const dispatch = useDispatch();

  const rolesState = useSelector((state) => state.roles);
  const {
    businessRoles = [],
    employeeRoles = [],
    isLoading,
    error,
    success,
  } = rolesState;

  const services = useSelector((state) => state.service?.services) || [];

  const { currentPermission } = useSelector((state) => state.permission);

  const [editRole, setEditRole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("employee");

  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionRole, setPermissionRole] = useState(null);
  const [existingPermissions, setExistingPermissions] = useState(null);

  const [permissionMode, setPermissionMode] = useState("role");

  /* -------------------- FETCH ROLES -------------------- */

  useEffect(() => {
    const roleType = activeTab === "employee" ? "employee" : "business";
    dispatch(getAllRolesByType(roleType));
  }, [dispatch, activeTab]);

  useEffect(() => {
    if (showPermissionModal) {
      dispatch(getAllServices({ type: "service" }));
    }
  }, [showPermissionModal, dispatch]);

  /* -------------------- CLEAR STATES -------------------- */

  useEffect(() => {
    return () => {
      dispatch(clearRoleError());
      dispatch(clearRoleSuccess());
    };
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        dispatch(clearRoleSuccess());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearRoleError());
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  /* -------------------- PERMISSION LOGIC -------------------- */
  useEffect(() => {
    if (currentPermission && permissionRole) {
      setExistingPermissions(currentPermission);
    } else {
      setExistingPermissions([]);
    }
  }, [currentPermission, permissionRole]);

  useEffect(() => {
    if (showPermissionModal && permissionRole?.id) {
      dispatch(getPermissionRoleById(permissionRole.id));
    }
  }, [dispatch, showPermissionModal, permissionRole]);

  /* -------------------- HANDLERS -------------------- */

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    dispatch(clearRoleError());
    dispatch(clearRoleSuccess());
  };

  const handleAddOrUpdate = async (roleData) => {
    const submitData = {
      name: roleData.name,
      description: roleData.description,
      type: "employee",
    };

    try {
      if (editRole) {
        await dispatch(updateRole(editRole.id, submitData));
        setEditRole(null);
      } else {
        await dispatch(createRole(submitData));
      }

      setIsModalOpen(false);

      const roleType = activeTab === "employee" ? "employee" : "business";
      dispatch(getAllRolesByType(roleType));
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (role) => {
    if (activeTab === "employee") {
      setEditRole(role);
      setIsModalOpen(true);
    }
  };

  const handleDelete = async (role) => {
    if (activeTab === "employee") {
      if (confirm(`Delete role "${role.name}" ?`)) {
        await dispatch(deleteRole(role.id));

        const roleType = activeTab === "employee" ? "employee" : "business";
        dispatch(getAllRolesByType(roleType));
      }
    }
  };

  const handlePermission = (role) => {
    setPermissionRole(role);
    setShowPermissionModal(true);
    setPermissionMode("role");
    setExistingPermissions(null);

    dispatch(getPermissionRoleById(role.id));
  };

  const handlePermissionSubmit = async (permissionData) => {
    await dispatch(upsertRolePermission(permissionData));

    setShowPermissionModal(false);

    const roleType = activeTab === "employee" ? "employee" : "business";
    dispatch(getAllRolesByType(roleType));
  };

  const handleCancel = () => {
    setEditRole(null);
    setIsModalOpen(false);
  };

  const filteredRoles =
    activeTab === "employee" ? employeeRoles : businessRoles;

  /* -------------------- UI -------------------- */

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}

      <PageHeader
        breadcrumb={["Dashboard", "Role Management"]}
        title="Role Management"
        description="Manage employee and business roles"
      />

      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        {/* HEADER + TABS */}

        <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-white">
                {activeTab === "employee" ? "Employee Roles" : "Business Roles"}
              </h2>

              <p className="text-blue-100 text-sm">Manage system roles</p>
            </div>

            {activeTab === "employee" && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/20 backdrop-blur text-white rounded-lg hover:bg-white/30"
              >
                <Plus size={18} />
                Create Role
              </button>
            )}
          </div>

          {/* TABS */}

          <div className="flex gap-4 mt-4">
            <button
              onClick={() => handleTabChange("employee")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === "employee"
                  ? "bg-white text-cyan-700"
                  : "text-white"
              }`}
            >
              Employee Roles
            </button>

            <button
              onClick={() => handleTabChange("business")}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === "business"
                  ? "bg-white text-cyan-700"
                  : "text-white"
              }`}
            >
              Business Roles
            </button>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 text-sm p-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* LOADING */}
        {isLoading && <EmptyState type="loading" />}

        {/* DATA TABLE */}
        {!isLoading && filteredRoles.length > 0 && (
          <RoleTable
            roles={filteredRoles}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onPermission={handlePermission}
            type={activeTab}
          />
        )}

        {/* EMPTY */}

        {!isLoading && filteredRoles.length === 0 && (
          <EmptyState type="empty" />
        )}
      </div>

      {/* ROLE MODAL */}

      <RoleFormModal
        isOpen={isModalOpen}
        onClose={handleCancel}
        onSubmit={handleAddOrUpdate}
        editData={editRole}
        isLoading={isLoading}
      />

      {/* PERMISSION MODAL */}
      {showPermissionModal && permissionRole && activeTab === "business" && (
        <AddUserPermission
          mode="role"
          onSubmit={handlePermissionSubmit}
          onCancel={() => setShowPermissionModal(false)}
          selectedUser={permissionRole}
          services={services}
          existingPermissions={existingPermissions}
        />
      )}

      {showPermissionModal && permissionRole && activeTab === "employee" && (
        <AddEmployeePermissions
          mode="role"
          selectedUser={permissionRole}
          existingPermissions={existingPermissions}
          onSubmit={handlePermissionSubmit}
          onCancel={() => setShowPermissionModal(false)}
        />
      )}
    </div>
  );
}
