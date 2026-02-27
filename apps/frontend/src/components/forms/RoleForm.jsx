// RoleFormModal.js
import { X } from "lucide-react";
import { useState, useEffect } from "react";

export function RoleFormModal({
  isOpen,
  onClose,
  onSubmit,
  editData,
  isLoading,
  type = "employee",
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (editData) {
      setName(editData.name || "");
      setDescription(editData.description || "");
    } else {
      setName("");
      setDescription("");
    }
    setErrors({});
  }, [editData, isOpen]);

  const handleNameChange = (e) => {
    let value = e.target.value.toUpperCase();
    value = value.replace(/[^A-Z\s]/g, "");
    setName(value);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = "Role name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Role name must be at least 2 characters";
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
    } else if (description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm()) return;

    const roleData = {
      name: name.trim(),
      description: description.trim(),
      type: "employee", // Force type to be 'employee' as per backend
    };

    // Note: 'level' is automatically handled by backend - don't send it
    // 'createdBy' will be handled by backend auth middleware

    onSubmit(roleData);
  };

  const handleClose = () => {
    setName("");
    setDescription("");
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {editData ? "Update Employee Role" : "Create Employee Role"}
            </h2>
            <p className="text-cyan-50 text-sm mt-1">
              {editData
                ? "Modify employee role details"
                : "Create a new employee role for your team"}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Error Messages */}
          {Object.keys(errors).length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="text-red-800 font-semibold mb-2">
                Please fix the following errors:
              </h3>
              <ul className="text-red-700 text-sm list-disc list-inside">
                {Object.values(errors).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Role Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="e.g., ADMINISTRATOR, MANAGER, SUPERVISOR"
                className={`w-full bg-gray-50 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                  errors.name
                    ? "border-red-400 focus:ring-red-300"
                    : "border-gray-300 focus:ring-cyan-500"
                }`}
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Only uppercase letters and spaces allowed. Must be unique.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={handleDescriptionChange}
                placeholder="Describe the role's responsibilities, permissions, and scope..."
                rows="4"
                className={`w-full bg-gray-50 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:border-transparent transition-all resize-none ${
                  errors.description
                    ? "border-red-400 focus:ring-red-300"
                    : "border-gray-300 focus:ring-cyan-500"
                }`}
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.description}
                </p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Minimum 10 characters required
              </p>
            </div>

            {/* Auto-generated fields info */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-blue-800 font-semibold text-sm mb-2">
                Auto-generated Information:
              </h4>
              <ul className="text-blue-700 text-xs space-y-1">
                <li className="flex items-center">
                  <span className="font-medium w-20">Level:</span>
                  <span>Automatically assigned by system</span>
                </li>
                <li className="flex items-center">
                  <span className="font-medium w-20">Type:</span>
                  <span>Employee Role</span>
                </li>
                <li className="flex items-center">
                  <span className="font-medium w-20">Permissions:</span>
                  <span>
                    Default view permissions assigned to all active services
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold hover:from-cyan-600 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {editData ? "Updating..." : "Creating..."}
                </>
              ) : editData ? (
                "Update Role"
              ) : (
                "Create Role"
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="text-green-800 font-semibold text-sm mb-2">
              Role Creation Information:
            </h4>
            <ul className="text-green-700 text-xs list-disc list-inside space-y-1">
              <li>Role level is automatically assigned by the system</li>
              <li>
                Default view permissions are automatically assigned to all
                active services
              </li>
              <li>Only employee roles can be created through this interface</li>
              <li>Business roles are system-managed and cannot be modified</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
