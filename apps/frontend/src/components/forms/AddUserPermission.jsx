import { useState, useEffect, useMemo } from "react";
import InputField from "../ui/InputField";
import ButtonField from "../ui/ButtonField";
import CloseBtn from "../ui/CloseBtn";
import HeaderSection from "../ui/HeaderSection";

const AddUserPermission = ({
  mode,
  onSubmit,
  onCancel,
  selectedUser,
  services,
  existingPermissions = [],
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    entityId: selectedUser?.id || "",
    permissions: {},
  });

  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const currentMode = existingPermissions?.length > 0 ? "edit" : "add";

  /* ------------------------------
     SERVICES LIST
  ------------------------------ */

  const processedServices = useMemo(() => {
    if (!services) return [];

    return services.map((s) => ({
      id: String(s.id),
      name: s.name,
      code: s.code,
    }));
  }, [services]);

  /* ------------------------------
     LOAD PERMISSIONS (EDIT / DEFAULT)
  ------------------------------ */

  useEffect(() => {
    if (!selectedUser?.id || !processedServices.length) return;

    const permissionMap = {};

    if (existingPermissions?.length > 0) {
      // EDIT MODE
      existingPermissions.forEach((perm) => {
        const serviceId = String(perm.serviceId || perm.service?.id);

        if (!serviceId) return;

        permissionMap[serviceId] = {
          canView: perm.canView ?? false,
          canProcess: perm.canProcess ?? false,
        };
      });

      // Ensure missing services bhi aa jaye
      processedServices.forEach((service) => {
        if (!permissionMap[service.id]) {
          permissionMap[service.id] = {
            canView: false,
            canProcess: false,
          };
        }
      });
    } else {
      // ADD MODE → all services default
      processedServices.forEach((service) => {
        permissionMap[service.id] = {
          canView: false,
          canProcess: false,
        };
      });
    }

    setFormData({
      entityId: selectedUser.id,
      permissions: permissionMap,
    });
  }, [processedServices, selectedUser, existingPermissions]);

  /* ------------------------------
     SEARCH FILTER
  ------------------------------ */

  const visibleServices = useMemo(() => {
    const term = serviceSearchTerm.toLowerCase();

    return processedServices.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.code?.toLowerCase().includes(term),
    );
  }, [serviceSearchTerm, processedServices]);

  /* ------------------------------
     TOGGLE PERMISSION
  ------------------------------ */

  const togglePermission = (serviceId, field) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [serviceId]: {
          ...prev.permissions[serviceId],
          [field]: !prev.permissions[serviceId][field],
        },
      },
    }));
  };

  /* ------------------------------
     SUBMIT
  ------------------------------ */

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.entityId) {
      setError("Invalid ID");
      return;
    }

    setIsSubmitting(true);

    try {
      const permissionData = {
        ...(mode === "role"
          ? { roleId: formData.entityId }
          : { userId: formData.entityId }),

        permissions: Object.keys(formData.permissions).map((serviceId) => ({
          serviceId,
          canView: formData.permissions[serviceId].canView,
          canProcess: formData.permissions[serviceId].canProcess,
        })),
      };

      await onSubmit(permissionData);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err.message ||
          "Failed to update permissions",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ------------------------------
     UI
  ------------------------------ */

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <HeaderSection
          title={
            mode === "role"
              ? currentMode === "add"
                ? "Add Role Permission"
                : "Edit Role Permission"
              : currentMode === "add"
                ? "Add User Permission"
                : "Edit User Permission"
          }
          tagLine="Configure permissions"
          isClose={onCancel}
        />
        <div className="p-6">
          {error && <div className="mb-3 text-red-600 text-sm">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* USER INFO */}
            <div className="p-3 bg-gray-50 border border-gray-300 rounded">
              <div className="font-medium">
                {selectedUser?.firstName || selectedUser?.name}{" "}
                {selectedUser?.lastName || ""}
              </div>
              <div className="text-xs text-gray-500">
                {selectedUser?.email ||
                  selectedUser?.description ||
                  selectedUser?.type ||
                  ""}
              </div>
            </div>

            {/* SEARCH (FILTER ONLY) */}
            <InputField
              label={"Service search"}
              name="serviceSearch"
              value={serviceSearchTerm}
              placeholder="Search service..."
              onChange={(e) => setServiceSearchTerm(e.target.value)}
            />

            {/* PERMISSIONS */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {visibleServices.map((service) => {
                const perm = formData.permissions[service.id];
                if (!perm) return null;

                return (
                  <div
                    key={service.id}
                    className="flex items-center justify-between border border-gray-300 p-3 rounded"
                  >
                    <div className="font-medium">{service.name}</div>

                    <div className="flex gap-6 items-center">
                      <label className="flex gap-2 items-center">
                        <input
                          type="checkbox"
                          checked={perm.canView}
                          onChange={() =>
                            togglePermission(service.id, "canView")
                          }
                        />
                        View
                      </label>

                      <label className="flex gap-2 items-center">
                        <input
                          type="checkbox"
                          checked={perm.canProcess}
                          onChange={() =>
                            togglePermission(service.id, "canProcess")
                          }
                        />
                        Process
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 pt-4 border-t border-gray-300">
              <CloseBtn isClose={onCancel} title="Cancel" />

              <ButtonField
                type="submit"
                name="Save Permissions"
                isLoading={isSubmitting || isLoading}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserPermission;
