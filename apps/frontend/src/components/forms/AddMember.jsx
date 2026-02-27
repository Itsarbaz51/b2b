// AddMember.js
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllRolesByType } from "../../redux/slices/roleSlice";
import { registerUser, updateUserProfile } from "../../redux/slices/userSlice";
// ✅ FIXED: Import employee actions
import {
  registerEmployee,
  updateEmployeeProfile,
} from "../../redux/slices/employeeSlice";

export default function AddMember({
  isAdmin = false,
  profileEdit = false,
  onClose,
  onSuccess,
  editData,
  type = "business",
}) {
  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    roleId: "",
    profileImage: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [imagePreview, setImagePreview] = useState(null);
  const dispatch = useDispatch();

  const roles = useSelector((state) => state?.roles?.roles || []);

  // Get display text based on type
  const getDisplayText = () => {
    if (type === "employee") {
      return {
        title: profileEdit
          ? "Profile Update"
          : editData
          ? "Edit Employee"
          : "Add New Employee",
        description: editData
          ? "Update existing employee details"
          : "Create a new employee account",
        button: profileEdit
          ? "Update Profile"
          : editData
          ? "Update Employee"
          : "Add Employee",
        loading: profileEdit
          ? "Updating Profile..."
          : editData
          ? "Updating..."
          : "Creating...",
        success: editData
          ? "Employee updated successfully!"
          : "Employee added successfully!",
      };
    } else {
      return {
        title: profileEdit
          ? "Profile Update"
          : editData
          ? "Edit Member"
          : "Add New Member",
        description: editData
          ? "Update existing user details"
          : "Create a new team user account",
        button: profileEdit
          ? "Update Profile"
          : editData
          ? "Update Member"
          : "Add Member",
        loading: profileEdit
          ? "Updating Profile..."
          : editData
          ? "Updating..."
          : "Creating...",
        success: editData
          ? "Member updated successfully!"
          : "Member added successfully!",
      };
    }
  };

  const displayText = getDisplayText();

  useEffect(() => {
    // Fetch roles based on type
    let roleType = "";
    if (type === "employee") roleType = "employee";
    if (type === "business") roleType = "business";

    if (roleType) {
      dispatch(getAllRolesByType(roleType));
    }

    if (editData) {
      setFormData({
        username: editData.username || "",
        firstName: editData.firstName || "",
        lastName: editData.lastName || "",
        email: editData.email || "",
        phoneNumber: editData.phoneNumber || "",
        roleId: editData.roleId || "",
        profileImage: null,
      });
      if (editData.profileImage) {
        setImagePreview(editData.profileImage);
      }
    }
  }, [editData, dispatch, type]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-generate username from email (only for new members)
    if (name === "email" && !editData) {
      const usernameFromEmail = value.split("@")[0];
      setFormData((prev) => ({
        ...prev,
        username: usernameFromEmail || "",
      }));
    }

    if (errors[name]) setErrors({ ...errors, [name]: "" });
    if (message.text) setMessage({ type: "", text: "" });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, profileImage: "Image must be less than 5MB" });
        return;
      }
      setFormData({ ...formData, profileImage: file });
      setImagePreview(URL.createObjectURL(file));
      setErrors({ ...errors, profileImage: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.phoneNumber)
      newErrors.phoneNumber = "Phone number is required";

    // Only validate role if not in profileEdit mode
    if (!profileEdit && !formData.roleId) newErrors.roleId = "Role is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ FIXED: Handle form submission based on type
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage({
        type: "error",
        text: "Please fill the required details before proceeding",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });
    setErrors({});

    try {
      let res;

      if (editData) {
        // Edit case
        const submitData = {
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          roleId: formData.roleId,
        };

        // Remove undefined fields
        Object.keys(submitData).forEach((key) => {
          if (
            submitData[key] === undefined ||
            submitData[key] === null ||
            submitData[key] === ""
          ) {
            delete submitData[key];
          }
        });

        // If profileEdit is true, don't send roleId
        if (profileEdit) {
          delete submitData.roleId;
        }

        // ✅ FIXED: Use appropriate update function based on type
        if (type === "employee") {
          res = await dispatch(updateEmployeeProfile(editData.id, submitData));
        } else {
          res = await dispatch(updateUserProfile(editData.id, submitData));
        }
      } else {
        // New member case
        const form = new FormData();
        Object.keys(formData).forEach((key) => {
          if (
            formData[key] !== null &&
            formData[key] !== undefined &&
            formData[key] !== ""
          ) {
            form.append(key, formData[key]);
          }
        });

        // ✅ FIXED: Use appropriate register function based on type
        if (type === "employee") {
          res = await dispatch(registerEmployee(form));
        } else {
          res = await dispatch(registerUser(form));
        }
      }

      // Check for success
      if (
        res?.success ||
        res?.status === "success" ||
        res?.data?.success ||
        res?.payload?.success
      ) {
        setMessage({
          type: "success",
          text: displayText.success,
        });

        onSuccess();
        onClose();
      } else {
        // Handle errors
        const errorData = res?.error || res?.payload || res?.data || {};
        const errorMessage = errorData?.message || "Operation failed";

        setMessage({
          type: "error",
          text: errorMessage,
        });

        // Set field-specific errors if available
        if (errorData?.errors && Array.isArray(errorData.errors)) {
          const formattedErrors = {};
          errorData.errors.forEach((err) => {
            formattedErrors[err.field] = err.message;
          });
          setErrors(formattedErrors);
        }
      }
    } catch (error) {
      const errorData = error?.response?.data || error;

      if (errorData.status === "fail" && Array.isArray(errorData.errors)) {
        const formattedErrors = {};
        errorData.errors.forEach((err) => {
          formattedErrors[err.field] = err.message;
        });
        setErrors(formattedErrors);

        setMessage(formattedErrors);
      } else {
        setMessage({
          type: "error",
          text:
            errorData?.message ||
            error?.message ||
            "Something went wrong. Please try again.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Conditionally determine field visibility/state
  const shouldDisableEmail = editData && !isAdmin;
  const shouldHideRole = profileEdit;
  const shouldHideProfileImage = profileEdit;

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {displayText.title}
            </h2>

            <p className="text-blue-100 text-sm mt-1">
              {displayText.description}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {message.text && (
            <div
              className={`mb-4 p-4 rounded-lg text-sm font-medium ${
                message.type === "error"
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Username - Always show in both modes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                    errors.username
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="Username"
                />
                {errors.username && (
                  <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                )}
              </div>

              {/* ✅ Email - Conditionally disabled in edit mode if not admin */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={shouldDisableEmail}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                    errors.email
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : "border-gray-300 focus:ring-blue-400"
                  } ${
                    shouldDisableEmail ? "bg-gray-100 cursor-not-allowed" : ""
                  }`}
                  placeholder="email@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
                {shouldDisableEmail && (
                  <p className="text-gray-500 text-sm mt-1">
                    Only admins can update email address
                  </p>
                )}
              </div>

              {/* First Name - Always show */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                    errors.firstName
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="First name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name - Always show */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                    errors.lastName
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                )}
              </div>

              {/* Phone Number - Always show */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value
                      .replace(/\D/g, "")
                      .slice(0, 10);
                    setFormData({ ...formData, phoneNumber: value });
                    if (errors.phoneNumber)
                      setErrors({ ...errors, phoneNumber: "" });
                  }}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                    errors.phoneNumber
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="10-digit number"
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* ✅ Role - Hidden in profileEdit mode */}
              {!shouldHideRole && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                      errors.roleId
                        ? "border-red-400 focus:ring-red-300 bg-red-50"
                        : "border-gray-300 focus:ring-blue-400"
                    }`}
                  >
                    <option value="">Select a role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name || role.roleName}
                      </option>
                    ))}
                  </select>
                  {errors.roleId && (
                    <p className="text-red-500 text-sm mt-1">{errors.roleId}</p>
                  )}
                </div>
              )}

              {/* ✅ Profile Image - Completely hidden in profileEdit mode */}
              {!shouldHideProfileImage && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Profile Image
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full"
                      disabled={loading}
                    />
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-full border border-gray-300"
                      />
                    )}
                  </div>
                  {errors.profileImage && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.profileImage}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? displayText.loading : displayText.button}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
