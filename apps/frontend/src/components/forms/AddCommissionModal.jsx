import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search } from "lucide-react";
import { createOrUpdateCommissionSetting } from "../../redux/slices/commissionSlice";
import { getAllRoles, getAllRolesByType } from "../../redux/slices/roleSlice";
import { getAllBusinessUsersByParentId } from "../../redux/slices/userSlice";
import { allServices } from "../../redux/slices/serviceSlice";

const scopes = ["ROLE", "USER"];
const commissionTypes = ["FLAT", "PERCENTAGE"];

const AddCommissionModal = ({ onClose, onSuccess, editData }) => {
  const dispatch = useDispatch();

  // Get roles, users, and services from Redux store
  const roles = useSelector((state) => state.roles?.roles || []);
  const rolesLoading = useSelector((state) => state.roles?.isLoading || false);

  const users = useSelector((state) => state.users?.users || []);
  const usersLoading = useSelector((state) => state.users?.isLoading || false);

  const services = useSelector(
    (state) => state.services?.serviceProviders?.allActiveServices || []
  );
  const servicesLoading = useSelector(
    (state) => state.service?.isLoading || false
  );

  const [formData, setFormData] = useState({
    scope: "ROLE",
    roleId: "",
    targetUserId: "",
    serviceId: "",
    commissionType: "FLAT",
    commissionValue: "",
    minAmount: "",
    maxAmount: "",
    applyTDS: false,
    tdsPercent: "",
    applyGST: false,
    gstPercent: "",
    applySurcharge: false,
    surchargeAmount: "",
    surchargeType: "PERCENTAGE", // Added surcharge type
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveTo: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState({ type: "", text: "" });
  const [userSearch, setUserSearch] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Prefill form if editData exists
  useEffect(() => {
    if (editData) {
      setFormData({
        scope: editData.scope || "ROLE",
        roleId: editData.roleId || "",
        targetUserId: editData.targetUserId || "",
        serviceId: editData.serviceId || "",
        commissionType: editData.commissionType || "FLAT",
        commissionValue: editData.commissionValue || "",
        minAmount: editData.minAmount || "",
        maxAmount: editData.maxAmount || "",
        applyTDS: editData.applyTDS || false,
        tdsPercent: editData.tdsPercent || "",
        applyGST: editData.applyGST || false,
        gstPercent: editData.gstPercent || "",
        applySurcharge: editData.applySurcharge || false,
        surchargeAmount: editData.surchargeAmount || "",
        surchargeType: editData.surchargeType || "PERCENTAGE",
        effectiveFrom: editData.effectiveFrom
          ? new Date(editData.effectiveFrom).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        effectiveTo: editData.effectiveTo
          ? new Date(editData.effectiveTo).toISOString().split("T")[0]
          : "",
      });

      // Prefill user search if editing USER scope
      if (editData.scope === "USER" && editData.targetUser) {
        setUserSearch(
          `${editData.targetUser.firstName || ""} ${
            editData.targetUser.lastName || ""
          }`.trim() + ` (${editData.targetUser.username || ""})`
        );
      }
    }
  }, [editData]);

  // Fetch roles, users and services when component mounts
  useEffect(() => {
    dispatch(getAllRoles());
    dispatch(allServices("active"));
    dispatch(getAllRolesByType("business"));
    dispatch(getAllBusinessUsersByParentId({ search: "", status: "ACTIVE" }));
  }, [dispatch]);

  // Filter users based on search
  useEffect(() => {
    if (userSearch.trim() === "") {
      setFilteredUsers(users.slice(0, 10));
    } else {
      const filtered = users
        .filter(
          (user) =>
            user.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.firstName?.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.lastName?.toLowerCase().includes(userSearch.toLowerCase()) ||
            user.phoneNumber?.includes(userSearch)
        )
        .slice(0, 10);
      setFilteredUsers(filtered);
    }
  }, [userSearch, users]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleScopeChange = (scope) => {
    setFormData({
      ...formData,
      scope,
      roleId: scope === "ROLE" ? formData.roleId : "",
      targetUserId: scope === "USER" ? formData.targetUserId : "",
    });
    setUserSearch("");
    setShowUserDropdown(false);

    // Clear related errors
    if (errors.roleId) setErrors({ ...errors, roleId: "" });
    if (errors.targetUserId) setErrors({ ...errors, targetUserId: "" });
  };

  const handleUserSearch = (searchTerm) => {
    setUserSearch(searchTerm);
    if (searchTerm.trim() !== "") {
      setShowUserDropdown(true);
    } else {
      setShowUserDropdown(false);
    }
  };

  const handleUserSelect = (user) => {
    setFormData({
      ...formData,
      targetUserId: user.id,
    });
    setUserSearch(
      `${user.firstName || ""} ${user.lastName || ""}`.trim() +
        ` (${user.username || ""})`
    );
    setShowUserDropdown(false);

    if (errors.targetUserId) {
      setErrors({ ...errors, targetUserId: "" });
    }
  };

  const handleUserSearchFocus = () => {
    if (userSearch.trim() !== "" || users.length > 0) {
      setShowUserDropdown(true);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.serviceId) newErrors.serviceId = "Service is required";

    if (!formData.commissionValue && formData.commissionValue !== 0) {
      newErrors.commissionValue = "Commission value is required";
    } else if (
      isNaN(formData.commissionValue) ||
      Number(formData.commissionValue) < 0
    ) {
      newErrors.commissionValue = "Commission value must be a valid number";
    }

    if (formData.scope === "ROLE" && !formData.roleId) {
      newErrors.roleId = "Role is required for ROLE scope";
    }

    if (formData.scope === "USER" && !formData.targetUserId) {
      newErrors.targetUserId = "Please select a user for USER scope";
    }

    // Date validation
    if (formData.effectiveFrom) {
      const fromDate = new Date(formData.effectiveFrom);
      if (isNaN(fromDate.getTime())) {
        newErrors.effectiveFrom = "Invalid effective from date";
      }
    }

    if (formData.effectiveTo) {
      const toDate = new Date(formData.effectiveTo);
      if (isNaN(toDate.getTime())) {
        newErrors.effectiveTo = "Invalid effective to date";
      }
    }

    // Check if effectiveTo is after effectiveFrom
    if (formData.effectiveFrom && formData.effectiveTo) {
      const fromDate = new Date(formData.effectiveFrom);
      const toDate = new Date(formData.effectiveTo);
      if (toDate <= fromDate) {
        newErrors.effectiveTo =
          "Effective to date must be after effective from date";
      }
    }

    // TDS validation
    if (
      formData.applyTDS &&
      (!formData.tdsPercent || isNaN(formData.tdsPercent))
    ) {
      newErrors.tdsPercent = "TDS percentage is required when TDS is applied";
    } else if (
      formData.applyTDS &&
      (Number(formData.tdsPercent) < 0 || Number(formData.tdsPercent) > 100)
    ) {
      newErrors.tdsPercent = "TDS percentage must be between 0 and 100";
    }

    // GST validation
    if (
      formData.applyGST &&
      (!formData.gstPercent || isNaN(formData.gstPercent))
    ) {
      newErrors.gstPercent = "GST percentage is required when GST is applied";
    } else if (
      formData.applyGST &&
      (Number(formData.gstPercent) < 0 || Number(formData.gstPercent) > 100)
    ) {
      newErrors.gstPercent = "GST percentage must be between 0 and 100";
    }

    // Surcharge validation
    if (
      formData.applySurcharge &&
      (!formData.surchargeAmount || isNaN(formData.surchargeAmount))
    ) {
      newErrors.surchargeAmount =
        "Surcharge value is required when surcharge is applied";
    } else if (
      formData.applySurcharge &&
      formData.surchargeType === "PERCENTAGE" &&
      (Number(formData.surchargeAmount) < 0 ||
        Number(formData.surchargeAmount) > 100)
    ) {
      newErrors.surchargeAmount =
        "Surcharge percentage must be between 0 and 100";
    } else if (
      formData.applySurcharge &&
      formData.surchargeType === "FLAT" &&
      Number(formData.surchargeAmount) < 0
    ) {
      newErrors.surchargeAmount = "Surcharge amount must be a positive number";
    }

    // Min/Max validation
    if (formData.minAmount && formData.maxAmount) {
      if (Number(formData.minAmount) > Number(formData.maxAmount)) {
        newErrors.maxAmount = "Max amount must be greater than min amount";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Convert date to ISO string with timezone
  const formatDateToISO = (dateString) => {
    if (!dateString) return undefined;

    const date = new Date(dateString);
    // Set to start of day in local timezone and convert to ISO
    return new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    ).toISOString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      setMessage({ type: "error", text: "Please fix validation errors" });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Prepare payload according to backend schema
      const payload = {
        scope: formData.scope,
        serviceId: formData.serviceId,
        commissionType: formData.commissionType,
        commissionValue: Number(formData.commissionValue),
        minAmount: formData.minAmount ? Number(formData.minAmount) : undefined,
        maxAmount: formData.maxAmount ? Number(formData.maxAmount) : undefined,
        applyTDS: formData.applyTDS,
        tdsPercent:
          formData.applyTDS && formData.tdsPercent
            ? Number(formData.tdsPercent)
            : undefined,
        applyGST: formData.applyGST,
        gstPercent:
          formData.applyGST && formData.gstPercent
            ? Number(formData.gstPercent)
            : undefined,
        applySurcharge: formData.applySurcharge,
        surchargeAmount:
          formData.applySurcharge && formData.surchargeAmount
            ? Number(formData.surchargeAmount)
            : undefined,
        surchargeType: formData.applySurcharge
          ? formData.surchargeType
          : undefined,
        effectiveFrom: formatDateToISO(formData.effectiveFrom),
        effectiveTo: formData.effectiveTo
          ? formatDateToISO(formData.effectiveTo)
          : undefined,
      };

      // Add scope-specific field
      if (formData.scope === "ROLE") {
        payload.roleId = formData.roleId;
      } else if (formData.scope === "USER") {
        payload.targetUserId = formData.targetUserId;
      }

      // If editing, include the commission ID
      if (editData?.id) {
        payload.id = editData.id;
      }

      const result = await dispatch(createOrUpdateCommissionSetting(payload));

      if (result?.payload?.data || result?.payload) {
        setMessage({
          type: "success",
          text: editData
            ? "Commission setting updated successfully!"
            : "Commission setting added successfully!",
        });

        // Auto-close on success after short delay
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      }
    } catch (error) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";
      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Format role name for display
  const formatRoleName = (roleName) => {
    if (!roleName) return "";

    // Convert snake_case to Title Case with spaces
    return roleName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  // Format service display name
  const formatServiceDisplayName = (service) => {
    if (!service) return "";

    return service.name || service.code || "Unknown Service";
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserDropdown && !event.target.closest(".user-search-container")) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserDropdown]);

  return (
    <div className="fixed inset-0 bg-opacity-50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700 px-6 py-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {editData
                ? "Edit Commission Setting"
                : "Add New Commission Setting"}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {editData
                ? "Update existing commission setting"
                : "Create a new commission setting for roles or users"}
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
              {/* Scope */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Scope *
                </label>
                <select
                  name="scope"
                  value={formData.scope}
                  onChange={(e) => handleScopeChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {scopes.map((scope) => (
                    <option key={scope} value={scope}>
                      {scope}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role (only for ROLE scope) */}
              {formData.scope === "ROLE" && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Role *
                  </label>
                  <select
                    name="roleId"
                    value={formData.roleId}
                    onChange={handleChange}
                    disabled={rolesLoading}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                      errors.roleId
                        ? "border-red-400 focus:ring-red-300 bg-red-50"
                        : rolesLoading
                        ? "bg-gray-100 cursor-not-allowed border-gray-300"
                        : "border-gray-300 focus:ring-blue-400"
                    }`}
                  >
                    <option value="">
                      {rolesLoading ? "Loading roles..." : "Select Role"}
                    </option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {formatRoleName(role.name) || role.name}
                      </option>
                    ))}
                  </select>
                  {errors.roleId && (
                    <p className="text-red-500 text-sm mt-1">{errors.roleId}</p>
                  )}
                  {rolesLoading && (
                    <p className="text-blue-500 text-sm mt-1">
                      Loading roles...
                    </p>
                  )}
                </div>
              )}

              {/* User Search (only for USER scope) */}
              {formData.scope === "USER" && (
                <div className="user-search-container relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select User *
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => handleUserSearch(e.target.value)}
                      onFocus={handleUserSearchFocus}
                      placeholder="Search users by name, username, email or phone..."
                      className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none ${
                        errors.targetUserId
                          ? "border-red-400 focus:ring-red-300 bg-red-50"
                          : usersLoading
                          ? "bg-gray-100 cursor-not-allowed border-gray-300"
                          : "border-gray-300 focus:ring-blue-400"
                      }`}
                      disabled={usersLoading}
                    />
                    {usersLoading && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                  </div>

                  {errors.targetUserId && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.targetUserId}
                    </p>
                  )}

                  {/* User Dropdown */}
                  {showUserDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredUsers.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500">
                          {usersLoading ? "Loading users..." : "No users found"}
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => handleUserSelect(user)}
                            className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          >
                            <div className="font-medium text-gray-900">
                              {user.firstName} {user.lastName || ""}
                            </div>
                            <div className="text-sm text-gray-500">
                              @{user.username} • {user.email}
                            </div>
                            {user.phoneNumber && (
                              <div className="text-sm text-gray-500">
                                📞 {user.phoneNumber}
                              </div>
                            )}
                            {user.role?.name && (
                              <div className="text-xs text-blue-600 mt-1">
                                {formatRoleName(user.role.name)}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {usersLoading && (
                    <p className="text-blue-500 text-sm mt-1">
                      Loading users...
                    </p>
                  )}
                </div>
              )}

              {/* Service */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service *
                </label>
                <select
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleChange}
                  disabled={servicesLoading}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                    errors.serviceId
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : servicesLoading
                      ? "bg-gray-100 cursor-not-allowed border-gray-300"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                >
                  <option value="">
                    {servicesLoading ? "Loading services..." : "Select Service"}
                  </option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {formatServiceDisplayName(service)}
                    </option>
                  ))}
                </select>
                {errors.serviceId && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.serviceId}
                  </p>
                )}
                {servicesLoading && (
                  <p className="text-blue-500 text-sm mt-1">
                    Loading services...
                  </p>
                )}
              </div>

              {/* Commission Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Commission Type *
                </label>
                <select
                  name="commissionType"
                  value={formData.commissionType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {commissionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Commission Value */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Commission Value *
                </label>
                <input
                  type="number"
                  name="commissionValue"
                  value={formData.commissionValue}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                    errors.commissionValue
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder={
                    formData.commissionType === "PERCENTAGE"
                      ? "Percentage value"
                      : "Amount in ₹"
                  }
                  step={formData.commissionType === "PERCENTAGE" ? "0.01" : "1"}
                  min="0"
                />
                {errors.commissionValue && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.commissionValue}
                  </p>
                )}
              </div>

              <div className="flex gap-5">
                {/* Min Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Min Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="minAmount"
                    value={formData.minAmount}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                      errors.minAmount
                        ? "border-red-400 focus:ring-red-300 bg-red-50"
                        : "border-gray-300 focus:ring-blue-400"
                    }`}
                    placeholder="Optional"
                    step="1"
                    min="0"
                  />
                  {errors.minAmount && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.minAmount}
                    </p>
                  )}
                </div>

                {/* Max Amount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Max Amount (₹)
                  </label>
                  <input
                    type="number"
                    name="maxAmount"
                    value={formData.maxAmount}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                      errors.maxAmount
                        ? "border-red-400 focus:ring-red-300 bg-red-50"
                        : "border-gray-300 focus:ring-blue-400"
                    }`}
                    placeholder="Optional"
                    step="1"
                    min="0"
                  />
                  {errors.maxAmount && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.maxAmount}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-5">
              {/* TDS Settings */}
              <div className="md:col-span-2 w-full">
                <div className="flex items-center space-x-6 p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="applyTDS"
                      name="applyTDS"
                      checked={formData.applyTDS}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="applyTDS"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      Apply TDS
                    </label>
                  </div>
                  {formData.applyTDS && (
                    <div className="flex-1 max-w-xs">
                      <input
                        type="number"
                        name="tdsPercent"
                        value={formData.tdsPercent}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                          errors.tdsPercent
                            ? "border-red-400 focus:ring-red-300 bg-red-50"
                            : "border-gray-300 focus:ring-blue-400"
                        }`}
                        placeholder="TDS Percentage"
                        step="0.01"
                        min="0"
                        max="100"
                      />
                      {errors.tdsPercent && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.tdsPercent}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* GST Settings */}
              <div className="md:col-span-2 w-full">
                <div className="flex items-center space-x-6 p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="applyGST"
                      name="applyGST"
                      checked={formData.applyGST}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="applyGST"
                      className="block text-sm font-semibold text-gray-700"
                    >
                      Apply GST
                    </label>
                  </div>
                  {formData.applyGST && (
                    <div className="flex-1 max-w-xs">
                      <input
                        type="number"
                        name="gstPercent"
                        value={formData.gstPercent}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                          errors.gstPercent
                            ? "border-red-400 focus:ring-red-300 bg-red-50"
                            : "border-gray-300 focus:ring-blue-400"
                        }`}
                        placeholder="GST Percentage"
                        step="0.01"
                        min="0"
                        max="100"
                      />
                      {errors.gstPercent && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.gstPercent}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Surcharge Settings */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-6 p-4 border border-gray-200 rounded-xl">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="applySurcharge"
                    name="applySurcharge"
                    checked={formData.applySurcharge}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label
                    htmlFor="applySurcharge"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Apply Surcharge
                  </label>
                </div>
                {formData.applySurcharge && (
                  <div className="flex-1 flex space-x-4">
                    <div className="flex-1 max-w-xs">
                      <select
                        name="surchargeType"
                        value={formData.surchargeType}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
                      >
                        <option value="PERCENTAGE">Percentage</option>
                        <option value="FLAT">Flat Amount</option>
                      </select>
                    </div>
                    <div className="flex-1 max-w-xs">
                      <input
                        type="number"
                        name="surchargeAmount"
                        value={formData.surchargeAmount}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                          errors.surchargeAmount
                            ? "border-red-400 focus:ring-red-300 bg-red-50"
                            : "border-gray-300 focus:ring-blue-400"
                        }`}
                        placeholder={
                          formData.surchargeType === "PERCENTAGE"
                            ? "Surcharge Percentage"
                            : "Surcharge Amount (₹)"
                        }
                        step={
                          formData.surchargeType === "PERCENTAGE" ? "0.01" : "1"
                        }
                        min="0"
                        max={
                          formData.surchargeType === "PERCENTAGE"
                            ? "100"
                            : undefined
                        }
                      />
                      {errors.surchargeAmount && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.surchargeAmount}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Effective From */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Effective From *
                </label>
                <input
                  type="date"
                  name="effectiveFrom"
                  value={formData.effectiveFrom}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                    errors.effectiveFrom
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                />
                {errors.effectiveFrom && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.effectiveFrom}
                  </p>
                )}
              </div>

              {/* Effective To */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Effective To
                </label>
                <input
                  type="date"
                  name="effectiveTo"
                  value={formData.effectiveTo}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none ${
                    errors.effectiveTo
                      ? "border-red-400 focus:ring-red-300 bg-red-50"
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                  placeholder="Optional"
                  min={formData.effectiveFrom}
                />
                {errors.effectiveTo && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.effectiveTo}
                  </p>
                )}
              </div>
            </div>
            {/* Submit Button */}
            <div className="pt-3 flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold transition-all disabled:opacity-50 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  loading || rolesLoading || usersLoading || servicesLoading
                }
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? editData
                    ? "Updating..."
                    : "Creating..."
                  : editData
                  ? "Update Commission"
                  : "Add Commission Setting"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddCommissionModal;
