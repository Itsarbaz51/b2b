import { useState, useEffect, useRef, useMemo } from "react";
import InputField from "../ui/InputField";
import ButtonField from "../ui/ButtonField";
import CloseBtn from "../ui/CloseBtn";

const AddUserPermission = ({
  mode, // "user" | "role"
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
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const serviceSearchRef = useRef(null);

  const currentMode =
    existingPermissions && existingPermissions.length > 0 ? "edit" : "add";

  /* ------------------------------
     LOAD EXISTING PERMISSIONS
  ------------------------------ */

  useEffect(() => {
    if (!selectedUser?.id) return;

    if (existingPermissions?.length > 0) {
      const permissionMap = {};

      existingPermissions.forEach((perm) => {
        const serviceId = perm.serviceId || perm.service?.id;

        if (!serviceId) return;

        permissionMap[serviceId] = {
          canView: perm.canView ?? false,
          canProcess: perm.canProcess ?? false,
        };
      });

      setFormData({
        entityId: selectedUser.id,
        permissions: permissionMap,
      });
    } else {
      setFormData({
        entityId: selectedUser.id,
        permissions: {},
      });
    }
  }, [existingPermissions, selectedUser]);

  /* ------------------------------
     SERVICES LIST
  ------------------------------ */

  const processedServices = useMemo(() => {
    if (!services) return [];

    return services.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
    }));
  }, [services]);

  const filteredServices = useMemo(() => {
    const term = serviceSearchTerm.toLowerCase();

    return processedServices.filter(
      (s) =>
        s.name?.toLowerCase().includes(term) ||
        s.code?.toLowerCase().includes(term),
    );
  }, [serviceSearchTerm, processedServices]);

  /* ------------------------------
     ADD SERVICE
  ------------------------------ */

  const handleServiceSelect = (service) => {
    setFormData((prev) => {
      if (prev.permissions[service.id]) return prev;

      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [service.id]: {
            canView: false,
            canProcess: false,
          },
        },
      };
    });

    setServiceSearchTerm("");
    setShowServiceSuggestions(false);
  };

  /* ------------------------------
     REMOVE SERVICE
  ------------------------------ */

  const handleServiceRemove = (serviceId) => {
    setFormData((prev) => {
      const updated = { ...prev.permissions };
      delete updated[serviceId];

      return {
        ...prev,
        permissions: updated,
      };
    });
  };

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
     CLOSE SUGGESTION ON OUTSIDE
  ------------------------------ */

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        serviceSearchRef.current &&
        !serviceSearchRef.current.contains(e.target)
      ) {
        setShowServiceSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ------------------------------
     UI
  ------------------------------ */

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {mode === "role"
                ? currentMode === "add"
                  ? "Add Role Permission"
                  : "Edit Role Permission"
                : currentMode === "add"
                  ? "Add User Permission"
                  : "Edit User Permission"}
            </h3>
            <CloseBtn isClose={onCancel} />
          </div>

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

            {/* SERVICE SEARCH */}

            <div ref={serviceSearchRef}>
              <InputField
                name="serviceSearch"
                value={serviceSearchTerm}
                placeholder="Search service..."
                onChange={(e) => {
                  setServiceSearchTerm(e.target.value);
                  setShowServiceSuggestions(true);
                }}
              />

              {showServiceSuggestions && serviceSearchTerm && (
                <div className="border border-gray-300 rounded shadow mt-1 max-h-52 overflow-y-auto">
                  {filteredServices.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleServiceSelect(service)}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                    >
                      {service.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PERMISSION TABLE */}

            <div className="space-y-3">
              {Object.keys(formData.permissions).map((serviceId) => {
                const service = processedServices.find(
                  (s) => s.id === serviceId,
                );

                const perm = formData.permissions[serviceId];

                return (
                  <div
                    key={serviceId}
                    className="flex items-center justify-between border border-gray-300 p-3 rounded"
                  >
                    <div className="font-medium">{service?.name}</div>

                    <div className="flex gap-6 items-center">
                      <label className="flex gap-2 items-center">
                        <input
                          type="checkbox"
                          checked={perm.canView}
                          onChange={() =>
                            togglePermission(serviceId, "canView")
                          }
                        />
                        View
                      </label>

                      <label className="flex gap-2 items-center">
                        <input
                          type="checkbox"
                          checked={perm.canProcess}
                          onChange={() =>
                            togglePermission(serviceId, "canProcess")
                          }
                        />
                        Process
                      </label>

                      <button
                        type="button"
                        onClick={() => handleServiceRemove(serviceId)}
                        className="text-red-500 text-sm"
                      >
                        Remove
                      </button>
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
