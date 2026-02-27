import React, { useCallback, useEffect, useState } from "react";
import AddPermission from "./forms/AddPermission";
import { useDispatch, useSelector } from "react-redux";
import { getAllRolesByType } from "../redux/slices/roleSlice";
import { getAllBusinessUsersByParentId } from "../redux/slices/userSlice";
import {
  updatePermissionInList,
  removePermissionFromList,
  createPermission,
} from "../redux/slices/permissionSlice";
import PageHeader from "./ui/PageHeader";
import ButtonField from "./ui/ButtonField";
import { Plus } from "lucide-react";

const RolePermissionsManager = () => {
  const dispatch = useDispatch();
  const permissions = useSelector(
    (state) => state.permissions?.permissions ?? []
  );

  const { roles } = useSelector((state) => state.roles);
  const { users, isLoading: usersLoading } = useSelector(
    (state) => state.users
  );

  const [showForm, setShowForm] = useState(false);
  const [editingPermission, setEditingPermission] = useState(null);
  const [formMode, setFormMode] = useState("add");
  const [selectedUser, setSelectedUser] = useState(null);

  // Load initial data
  useEffect(() => {
    dispatch(getAllRolesByType("business"));
    loadUsers(); // Load initial users
  }, [dispatch]);

  const loadUsers = useCallback(
    async (searchTerm = "", forceRefresh = false) => {
      try {
        const params = {
          page: 1,
          limit: 50, // Reduced limit for better performance
          sort: "desc",
          status: "ALL",
        };

        // Add search term if provided
        if (searchTerm) {
          params.search = searchTerm;
        }

        if (forceRefresh) {
          params.timestamp = Date.now();
          params.refresh = true;
        }

        await dispatch(getAllBusinessUsersByParentId());
      } catch (error) {
        console.error("Failed to load users:", error);
      }
    },
    [dispatch]
  );

  const handleAddPermission = async (permissionData) => {
    try {
      const permissionToAdd = {
        id: Date.now().toString(),
        ...permissionData,
      };
      // Call the async action instead of direct add
      await dispatch(createPermission(permissionToAdd, "role-upsert"));
      setShowForm(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to add permission:", error);
    }
  };

  const handleEditPermission = (permissionData) => {
    dispatch(
      updatePermissionInList({
        ...permissionData,
        id: editingPermission.id,
      })
    );
    setShowForm(false);
    setEditingPermission(null);
    setFormMode("add");
    setSelectedUser(null);
  };

  const handleDeletePermission = (id) => {
    dispatch(removePermissionFromList(id));
  };

  const handleEditClick = (permission) => {
    setEditingPermission(permission);
    setFormMode("edit");
    setShowForm(true);

    // Pre-select user if it's a user permission
    if (permission.userId) {
      const user = users?.find((u) => u.id === permission.userId);
      setSelectedUser(user || { id: permission.userId });
    }
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingPermission(null);
    setFormMode("add");
    setSelectedUser(null);
  };

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-center">
        <PageHeader
          breadcrumb={["Dashboard", "permission"]}
          title="Role Permissions Manager"
          description="Manage user and role permissions across services"
        />

        <ButtonField
          name="Add Permission"
          isOpen={() => {
            setSelectedUser(null);
            setShowForm(true);
          }}
          icon={Plus}
        />
      </div>

      {/* Permissions Grid */}
      {permissions.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No permissions
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by adding a new permission.
          </p>
          <div className="mt-6">
            <ButtonField
              name="Add Permission"
              isOpen={() => {
                setSelectedUser(null);
                setShowForm(true);
              }}
              icon={Plus}
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {permissions.map((permission) => (
            <PermissionCard
              key={permission.id}
              permission={permission}
              onEdit={handleEditClick}
              onDelete={handleDeletePermission}
              services={services}
              users={users}
              roles={roles}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <AddPermission
          key={editingPermission?.id || "add-form"} // forces remount
          mode={formMode}
          permission={editingPermission}
          onSubmit={
            formMode === "add" ? handleAddPermission : handleEditPermission
          }
          onCancel={handleCancelEdit}
          roles={roles}
          users={users}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          loadUsers={loadUsers}
          usersLoading={usersLoading}
          services={services}
        />
      )}
    </div>
  );
};

export default RolePermissionsManager;

const PermissionCard = ({
  permission,
  onEdit,
  onDelete,
  services,
  users,
  roles,
}) => {
  const getServiceNames = (serviceIds) => {
    return serviceIds.map((serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      return service ? service.name : serviceId;
    });
  };

  const getEntityName = () => {
    if (permission.roleId) {
      const role = roles?.find((r) => r.id === permission.roleId);
      return role?.name || permission.roleId;
    } else {
      const user = users?.find((u) => u.id === permission.userId);
      return user?.name || user?.email || permission.userId;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {permission.roleId ? "Role Permission" : "User Permission"}
          </h3>
          <span
            className={`inline-block mt-1 px-2 py-1 text-xs rounded-full ${
              permission.roleId
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {permission.roleId ? "Role" : "User"}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(permission)}
            className="text-blue-500 hover:text-blue-700 p-1 transition-colors"
            title="Edit permission"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
          <button
            onClick={() => onDelete(permission.id)}
            className="text-red-500 hover:text-red-700 p-1 transition-colors"
            title="Delete permission"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-600">
            {permission.roleId ? "Role" : "User"}
          </label>
          <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
            {getEntityName()}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Services ({permission.serviceIds?.length || 0})
          </label>
          <div className="space-y-2">
            {getServiceNames(permission.serviceIds || []).map(
              (serviceName, index) => (
                <div
                  key={index}
                  className="text-sm text-gray-700 bg-gray-50 p-2 rounded"
                >
                  {serviceName}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="text-md font-medium text-gray-700 mb-3">Permissions</h4>
        <div className="flex flex-wrap gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              permission.canView
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            View: {permission.canView ? "Yes" : "No"}
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              permission.canEdit
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            Edit: {permission.canEdit ? "Yes" : "No"}
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              permission.canSetCommission
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-red-100 text-red-800 border border-red-200"
            }`}
          >
            Commission: {permission.canSetCommission ? "Yes" : "No"}
          </div>
        </div>
      </div>
    </div>
  );
};
