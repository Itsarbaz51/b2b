import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { InputField } from "../ui/InputField";
import ButtonField from "../ui/ButtonField";
import CloseBtn from "../ui/CloseBtn";

const AddPermission = ({
  mode,
  onSubmit,
  onCancel,
  selectedUser,
  services,
  existingPermissions = null,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState({
    userId: selectedUser?.id || "",
    serviceIds: [],
    canView: false,
    canEdit: false,
    canSetCommission: false,
  });

  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const serviceSearchRef = useRef(null);

  // Determine current mode properly
  const currentMode = existingPermissions ? "edit" : "add";

  useEffect(() => {
    if (!selectedUser?.id) return;

    if (
      existingPermissions &&
      Array.isArray(existingPermissions) &&
      existingPermissions.length > 0
    ) {
      // Handle array of permission objects
      const permission = existingPermissions[0]; // Take first permission object

      let parsedServiceIds = [];
      let canView = false;
      let canEdit = false;
      let canSetCommission = false;

      // Extract service IDs from the permission objects
      if (Array.isArray(existingPermissions)) {
        parsedServiceIds = existingPermissions
          .map((perm) => {
            // Get service ID from service object or serviceId field
            if (perm.service?.id) {
              return perm.service.id;
            } else if (perm.serviceId) {
              return perm.serviceId;
            }
            return null;
          })
          .filter((id) => id !== null);

        // Use permissions from the first item (assuming all have same permissions for same user)
        if (existingPermissions.length > 0) {
          canView = existingPermissions[0].canView ?? false;
          canEdit = existingPermissions[0].canEdit ?? false;
          canSetCommission = existingPermissions[0].canSetCommission ?? false;
        }
      }

      setFormData({
        userId: permission?.userId || permission?.user?.id || selectedUser.id,
        serviceIds: parsedServiceIds,
        canView: canView,
        canEdit: canEdit,
        canSetCommission: canSetCommission,
      });
    } else if (existingPermissions && !Array.isArray(existingPermissions)) {
      // Handle single permission object (backward compatibility)
      let parsedServiceIds = [];

      if (existingPermissions.service?.id) {
        parsedServiceIds = [existingPermissions.service.id];
      } else if (existingPermissions.serviceId) {
        parsedServiceIds = [existingPermissions.serviceId];
      } else if (existingPermissions.serviceIds) {
        if (Array.isArray(existingPermissions.serviceIds)) {
          parsedServiceIds = existingPermissions.serviceIds;
        } else if (typeof existingPermissions.serviceIds === "string") {
          if (existingPermissions.serviceIds.startsWith("[")) {
            try {
              parsedServiceIds = JSON.parse(existingPermissions.serviceIds);
            } catch (error) {
              console.warn("Failed to parse serviceIds JSON:", error);
            }
          } else {
            parsedServiceIds = existingPermissions.serviceIds
              .split(",")
              .map((id) => id.trim())
              .filter((id) => id !== "");
          }
        }
      }

      setFormData({
        userId:
          existingPermissions?.userId ||
          existingPermissions?.roleId ||
          selectedUser.id,
        serviceIds: parsedServiceIds,
        canView: existingPermissions?.canView ?? false,
        canEdit: existingPermissions?.canEdit ?? false,
        canSetCommission: existingPermissions?.canSetCommission ?? false,
      });
    } else {
      // Reset for add mode
      setFormData({
        userId: selectedUser.id,
        serviceIds: [],
        canView: false,
        canEdit: false,
        canSetCommission: false,
      });
    }
  }, [existingPermissions, selectedUser]);

  const filteredServices = useCallback(() => {
    if (!services || !Array.isArray(services)) return [];

    const searchTerm = serviceSearchTerm.toLowerCase();

    return services.filter(
      (service) =>
        service.type?.toLowerCase().includes(searchTerm) ||
        service.id?.toLowerCase().includes(searchTerm) ||
        service.name?.toLowerCase().includes(searchTerm) ||
        service.code?.toLowerCase().includes(searchTerm)
    );
  }, [services, serviceSearchTerm]);

  const handleServiceSelect = useCallback(
    (service) => {
      if (!formData.serviceIds.includes(service.id)) {
        setFormData((prev) => ({
          ...prev,
          serviceIds: [...prev.serviceIds, service.id],
        }));
      }
      setServiceSearchTerm("");
      setShowServiceSuggestions(false);
    },
    [formData.serviceIds]
  );

  const handleServiceRemove = useCallback((serviceId) => {
    setFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.filter((id) => id !== serviceId),
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation - only check for user ID, removed service requirement
    if (!formData.userId) {
      setError("User ID is missing. Please check the selected user.");
      return;
    }

    setIsSubmitting(true);

    try {
      const permissionData = {
        ...(mode === "role"
          ? { roleId: formData.userId }
          : { userId: formData.userId }),
        serviceIds: formData.serviceIds,
        canView: formData.canView,
        canEdit: formData.canEdit,
        canSetCommission: formData.canSetCommission,
      };

      await onSubmit(permissionData);
    } catch (error) {
      console.error("Failed to submit permission:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to update permissions"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = useCallback(
    (field, value) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      if (error) setError("");
    },
    [error]
  );

  const getSelectedServiceNames = useCallback(() => {
    if (!services || !Array.isArray(services)) return [];

    return formData.serviceIds.map((serviceId) => {
      const service = services.find((s) => s.id === serviceId);
      return (service && service?.name) || service?.code;
    });
  }, [formData.serviceIds, services]);

  const selectedServiceNames = useMemo(
    () => getSelectedServiceNames(),
    [getSelectedServiceNames]
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        serviceSearchRef.current &&
        !serviceSearchRef.current.contains(event.target)
      ) {
        setShowServiceSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              {currentMode === "add"
                ? `Add ${mode === "role" ? "Role" : "User"} Permission`
                : `Edit ${mode === "role" ? "Role" : "User"} Permission`}
            </h3>
            <CloseBtn
              isClose={onCancel}
              disabled={isSubmitting || isLoading}
              title="Close dialog"
            />
          </div>

          {/* ✅ Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User/Role Information (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mode === "role" ? "Role" : "User"}
              </label>
              <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                {mode === "role" ? (
                  <>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedUser?.name || ""}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {selectedUser?.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Role ID: {selectedUser?.id}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm font-medium text-gray-900">
                      {selectedUser?.firstName} {selectedUser?.lastName || ""}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {selectedUser?.email} • {selectedUser?.phoneNumber}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      User ID: {selectedUser?.id}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Services
                <span className="text-xs text-gray-500 ml-2">
                  (Multiple selection allowed)
                </span>
              </label>

              {/* Selected Services */}
              {formData.serviceIds.length > 0 ? (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Selected Services ({formData.serviceIds.length}):
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {selectedServiceNames.map((serviceName, index) => {
                      const serviceId = formData.serviceIds[index];

                      if (!serviceName) return null;

                      return (
                        <span
                          key={serviceId}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-800 border border-blue-300"
                        >
                          {serviceName}
                          <button
                            type="button"
                            onClick={() => handleServiceRemove(serviceId)}
                            className="ml-2 text-blue-600 hover:text-blue-800 transition-colors"
                            disabled={isSubmitting || isLoading}
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-700 text-xs">
                    No services selected. You can still submit without services.
                  </p>
                </div>
              )}

              {/* Service Search Input */}
              <div className="relative" ref={serviceSearchRef}>
                <InputField
                  label=""
                  name="serviceSearch"
                  type="text"
                  value={serviceSearchTerm}
                  onChange={(e) => {
                    setServiceSearchTerm(e.target.value);
                    setShowServiceSuggestions(true);
                  }}
                  onFocus={() => setShowServiceSuggestions(true)}
                  placeholder="Search services by name..."
                  disabled={isSubmitting || isLoading}
                  required={false}
                />

                {isLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}

                {/* Service Suggestions */}
                {showServiceSuggestions && serviceSearchTerm && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {isLoading ? (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                          Loading services...
                        </div>
                      </div>
                    ) : filteredServices().length > 0 ? (
                      filteredServices().map((service) => (
                        <div
                          key={service.id}
                          onClick={() => handleServiceSelect(service)}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="font-medium text-gray-900">
                            {service.type || service.name}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {service.id}
                          </div>
                          {formData.serviceIds.includes(service.id) && (
                            <div className="text-xs text-green-600 mt-1">
                              ✓ Already selected
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-gray-500 text-sm">
                        No services found
                      </div>
                    )}
                  </div>
                )}
              </div>

              {services?.length === 0 && !isLoading && (
                <div className="text-xs text-gray-500 mt-1">
                  No services available. You can still submit without services.
                </div>
              )}
            </div>

            {/* Permissions Checkboxes */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Permissions
                {currentMode === "edit" && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Updating existing permissions)
                  </span>
                )}
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.canView}
                    onChange={(e) =>
                      handleInputChange("canView", e.target.checked)
                    }
                    className="rounded text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting || isLoading}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Can View
                  </span>
                </label>

                {/* <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.canEdit}
                    onChange={(e) =>
                      handleInputChange("canEdit", e.target.checked)
                    }
                    className="rounded text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting || isLoading}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Can Edit
                  </span>
                </label> */}

                {/* <label className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.canSetCommission}
                    onChange={(e) =>
                      handleInputChange("canSetCommission", e.target.checked)
                    }
                    className="rounded text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting || isLoading}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Can Set Commission
                  </span>
                </label> */}
              </div>

              {/* Permission Hint */}
              <div className="text-xs text-gray-500 mt-2">
                Select one or more permissions for the selected services
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <CloseBtn
                isClose={onCancel}
                disabled={isSubmitting || isLoading}
                title="Cancel"
                variant="text"
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </CloseBtn>
              <ButtonField
                name={
                  currentMode === "add"
                    ? `Add ${mode === "role" ? "Role" : "User"} Permission`
                    : `Update ${mode === "role" ? "Role" : "User"} Permission`
                }
                type="submit"
                isOpen={handleSubmit}
                isLoading={isSubmitting || isLoading}
                btncss="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPermission;
