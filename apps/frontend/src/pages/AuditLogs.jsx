import { useDebounce } from "use-debounce";
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Shield,
  User,
  Clock,
  Monitor,
  Globe,
  ChevronDown,
  ChevronUp,
  Activity,
  Search,
  ArrowUpDown,
  FileText,
  X,
} from "lucide-react";
import { getAuditLogs } from "../redux/slices/logsSlice";
import { getAllRoles } from "../redux/slices/roleSlice";
import RefreshToast from "../components/ui/RefreshToast";
import Pagination from "../components/ui/Pagination"; // Import Pagination component

const AuditLogs = () => {
  const dispatch = useDispatch();
  const { logsList, loading, error } = useSelector((state) => state.logs);

  // Search input reference to maintain focus
  const searchInputRef = useRef(null);

  const [expandedLog, setExpandedLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm] = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter states
  const [deviceFilterOpen, setDeviceFilterOpen] = useState(false);
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const [filters, setFilters] = useState({
    deviceType: "all",
    roleId: "",
    sort: "desc",
    sortBy: "timestamp",
  });

  // Get current user from auth state
  const { currentUser } = useSelector((state) => state.auth);
  const roles = useSelector((state) => state?.roles?.roles || []);

  const isAdmin = useMemo(
    () => currentUser.role?.name === "ADMIN",
    [currentUser]
  );

  useEffect(() => {
    if (isAdmin) {
      dispatch(getAllRoles());
    }
  }, [dispatch, isAdmin]);

  // Stable fetch function that doesn't change on every render
  const fetchLogs = useCallback(() => {
    const params = {
      page: currentPage,
      limit: 10,
      search: debouncedSearchTerm,
      searchFields: [
        "user.firstName",
        "user.lastName",
        "user.email",
        "message.ipAddress",
        "message.metadata.location",
      ],
      ...filters,
    };

    if (currentUser?.role?.type !== "ADMIN") {
      params.userId = currentUser?.id;
    }

    dispatch(getAuditLogs(params));
  }, [currentPage, debouncedSearchTerm, filters, currentUser, dispatch]);

  // Separate useEffect for fetching logs
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Maintain search input focus
  useEffect(() => {
    if (
      searchInputRef.current &&
      document.activeElement === searchInputRef.current
    ) {
      // If search input was focused, keep it focused after re-render
      searchInputRef.current.focus();
    }
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getActionColor = (action) => {
    if (!action) return "text-blue-600";
    if (action.includes("UPDATED")) return "text-yellow-600";

    if (
      ["SUCCESS", "VERIFIED", "REGISTERED", "CREATE", "ACTIVATED"].some((key) =>
        action.includes(key)
      )
    )
      return "text-green-600";
    if (
      ["FAILED", "REJECT", "ERROR", "LOGOUT", "DELETED", "DEACTIVATED"].some(
        (keyword) => action.includes(keyword)
      )
    ) {
      return "text-red-600";
    }

    return "text-blue-600";
  };

  const getActionBg = (action) => {
    if (!action) return "bg-blue-50 border-blue-200";
    if (action.includes("UPDATED")) return "bg-yellow-50 border-yellow-200";

    if (
      ["SUCCESS", "VERIFIED", "REGISTERED", "CREATE", "ACTIVATED"].some((key) =>
        action.includes(key)
      )
    )
      return "bg-green-50 border-green-200";

    if (
      ["FAILED", "ERROR", "LOGOUT", "REJECT", "DELETED", "DEACTIVATED"].some(
        (keyword) => action.includes(keyword)
      )
    )
      return "bg-red-50 border-red-200";

    return "bg-blue-50 border-blue-200";
  };

  // Calculate showing from/to values
  const getShowingFrom = () => {
    if (!logsList?.data?.pagination) return 0;
    return logsList.data.pagination.showingFrom || 1;
  };

  const getShowingTo = () => {
    if (!logsList?.data?.pagination) return 0;
    return logsList.data.pagination.showingTo || 0;
  };

  // Handle search - maintain focus
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  // Stable filter handlers
  const handleDeviceFilterChange = useCallback((deviceType) => {
    setFilters((prev) => ({
      ...prev,
      deviceType,
    }));
    setCurrentPage(1);
    setDeviceFilterOpen(false);
  }, []);

  const handleRoleFilterChange = useCallback((roleId) => {
    setFilters((prev) => ({
      ...prev,
      roleId,
    }));
    setCurrentPage(1);
    setRoleFilterOpen(false);
  }, []);

  const handleSortChange = useCallback((sort) => {
    setFilters((prev) => ({
      ...prev,
      sort,
    }));
    setCurrentPage(1);
    setSortOpen(false);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      deviceType: "all",
      roleId: "",
      sort: "desc",
      sortBy: "timestamp",
    });
    setSearchTerm("");
    setCurrentPage(1);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (deviceFilterOpen && !event.target.closest(".device-filter")) {
        setDeviceFilterOpen(false);
      }
      if (roleFilterOpen && !event.target.closest(".role-filter")) {
        setRoleFilterOpen(false);
      }
      if (sortOpen && !event.target.closest(".sort-filter")) {
        setSortOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [deviceFilterOpen, roleFilterOpen, sortOpen]);

  // Calculate stats
  const calculateStats = () => {
    if (
      !logsList?.data?.paginatedLogs ||
      !Array.isArray(logsList?.data?.paginatedLogs)
    ) {
      return { totalEvents: 0, successRate: 0, activeUsers: 0, ipAddresses: 0 };
    }

    const totalEvents =
      logsList.data.pagination?.totalItems ||
      logsList.data.pagination?.totalCount ||
      logsList?.data?.paginatedLogs.length ||
      0;

    const successEvents =
      logsList?.data?.paginatedLogs?.filter((log) =>
        ["SUCCESS", "CREATED", "VERIFIED", "REGISTERED", "ACTIVATED"].some(
          (keyword) => log.message?.action?.includes(keyword)
        )
      )?.length || 0;

    const successRate =
      totalEvents > 0 ? (successEvents / totalEvents) * 100 : 0;

    const uniqueUsers = new Set(
      logsList?.data?.paginatedLogs.map((log) => log.user?.id).filter(Boolean)
    ).size;

    const uniqueIPs = new Set(
      logsList?.data?.paginatedLogs
        .map((log) => log.message?.ipAddress)
        .filter(Boolean)
    ).size;

    return {
      totalEvents,
      successRate: Math.round(successRate),
      activeUsers: uniqueUsers,
      ipAddresses: uniqueIPs,
    };
  };

  const stats = calculateStats();

  // Check if any filters are active for Clear Filters button
  const hasActiveFilters = useMemo(() => {
    return (
      filters.deviceType !== "all" ||
      filters.roleId !== "" ||
      filters.sort !== "desc" ||
      searchTerm !== ""
    );
  }, [filters, searchTerm]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden p-6">
      {/* Header with Filters */}
      <div className="p-6 border-b border-slate-200 flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
        {/* Search - Updated placeholder to reflect table-only search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search users, IPs, actions..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div className="flex gap-3">
          {/* Device Filter */}
          <div className="relative device-filter">
            <button
              onClick={() => setDeviceFilterOpen(!deviceFilterOpen)}
              className="inline-flex items-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium"
            >
              <Monitor className="h-4 w-4" />
              Device
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  deviceFilterOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {deviceFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                    Device Type
                  </div>
                  {["all", "desktop", "mobile", "tablet"].map((device) => (
                    <button
                      key={device}
                      onClick={() => handleDeviceFilterChange(device)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.deviceType === device
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {device === "all"
                        ? "All Devices"
                        : device.charAt(0).toUpperCase() + device.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Role Filter - Fixed */}
          {isAdmin && (
            <div className="relative role-filter">
              <button
                onClick={() => setRoleFilterOpen(!roleFilterOpen)}
                className="inline-flex items-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium"
              >
                <User className="h-4 w-4" />
                Role
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    roleFilterOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {roleFilterOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                      User Role
                    </div>
                    <button
                      onClick={() => handleRoleFilterChange("")}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.roleId === ""
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      All Roles
                    </button>
                    {roles?.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => handleRoleFilterChange(role.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          filters.roleId === role.id
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {role.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sort */}
          <div className="relative sort-filter">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="inline-flex items-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium"
            >
              <ArrowUpDown className="h-4 w-4" />
              {filters.sort ? filters.sort.toUpperCase() : "Sort"}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${
                  sortOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {sortOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl border border-slate-200 shadow-xl z-20 overflow-hidden">
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase">
                    Sort Order
                  </div>
                  {["asc", "desc"].map((order) => (
                    <button
                      key={order}
                      onClick={() => handleSortChange(order)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        filters.sort === order
                          ? "bg-blue-50 text-blue-700 font-medium"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {order.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Refresh */}
          <RefreshToast isLoading={loading} onClick={handleRefresh} />

          {/* Clear Filters Button - Only show when filters are active */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium"
            >
              <X className="h-4 w-4" />
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards - These won't be affected by search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 py-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-lg">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-gray-600 text-sm">Total Events</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalEvents}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-lg">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-gray-600 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.successRate}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-lg">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-gray-600 text-sm">Active Users</p>
              <p className="text-2xl font-bold text-blue-600">
                {stats.activeUsers}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-2xl p-6 hover:scale-105 transition-transform duration-300 shadow-sm hover:shadow-lg">
          <div className="flex items-center gap-3">
            <Globe className="w-8 h-8 text-cyan-600" />
            <div>
              <p className="text-gray-600 text-sm">IP Addresses</p>
              <p className="text-2xl font-bold text-cyan-600">
                {stats.ipAddresses}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Table - Search only applies to this content */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  #
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Role Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logsList?.data?.paginatedLogs &&
              logsList?.data?.paginatedLogs.length > 0 ? (
                logsList?.data?.paginatedLogs.map((log, index) => (
                  <React.Fragment key={index}>
                    <tr className="hover:bg-blue-50 transition-colors duration-200">
                      <td className="px-6 py-4">{getShowingFrom() + index}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {log.user?.firstName?.[0] || "U"}
                            {log.user?.lastName?.[0] || "S"}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">
                              {log.user?.firstName} {log.user?.lastName}
                            </div>
                            <div className="text-xs text-gray-600">
                              {log.user?.email}
                            </div>
                            <div className="text-xs text-gray-600">
                              +91-{log.user?.phoneNumber}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getActionBg(
                            log.message?.action
                          )} ${getActionColor(log.message?.action)}`}
                        >
                          {log.message?.action?.replace(/_/g, " ") || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {log.message?.metadata?.roleName ||
                            log.user?.role?.name ||
                            "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Clock className="w-4 h-4 text-gray-500" />
                          {formatTime(log.timestamp)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Globe className="w-4 h-4 text-gray-500" />
                          {log.message?.ipAddress || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Monitor className="w-4 h-4 text-gray-500" />
                          {log.message?.metadata?.userAgent?.device?.type ||
                            "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() =>
                            setExpandedLog(expandedLog === index ? null : index)
                          }
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                        >
                          {expandedLog === index ? (
                            <ChevronUp className="w-5 h-5 text-blue-600" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-600" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {expandedLog === index && (
                      <tr className="bg-blue-50">
                        <td colSpan="8" className="px-6 py-6">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Parent details */}
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                              <h3 className="text-gray-900 font-semibold flex items-center gap-2 mb-3">
                                <Activity className="w-4 h-4 text-blue-600" />
                                Parents Details
                              </h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Email:</span>
                                  <span className="text-gray-900 font-mono font-medium">
                                    {log.user?.parent?.email || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Phone Number:
                                  </span>
                                  <span className="text-gray-900 font-mono text-xs font-medium">
                                    {log.user?.parent?.phoneNumber || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Hierarchy Level:
                                  </span>
                                  <span className="text-green-600 font-semibold">
                                    {log.user?.parent?.hierarchyLevel || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {/* Device Information */}
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                              <h3 className="text-gray-900 font-semibold flex items-center gap-2 mb-3">
                                <Monitor className="w-4 h-4 text-blue-600" />
                                Device Information
                              </h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Browser:
                                  </span>
                                  <span className="text-gray-900 font-medium">
                                    {log.message?.metadata?.userAgent?.browser
                                      ?.name || "N/A"}{" "}
                                    {log.message?.metadata?.userAgent?.browser
                                      ?.version || ""}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Device:</span>
                                  <span className="text-gray-900 font-medium">
                                    {log.message?.metadata?.userAgent?.device
                                      ?.type || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">OS:</span>
                                  <span className="text-gray-900 font-medium">
                                    {log.message?.metadata?.userAgent?.device
                                      ?.os || "N/A"}{" "}
                                    {log.message?.metadata?.userAgent?.device
                                      ?.osVersion || ""}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Request Details */}
                            <div className="bg-white rounded-lg p-4 border border-blue-100">
                              <h3 className="text-gray-900 font-semibold flex items-center gap-2 mb-3">
                                <Activity className="w-4 h-4 text-blue-600" />
                                Request Details
                              </h3>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Method:</span>
                                  <span className="text-gray-900 font-mono font-medium">
                                    {log.message?.metadata?.method || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Endpoint:
                                  </span>
                                  <span className="text-gray-900 font-mono text-xs font-medium">
                                    {log.message?.metadata?.url || "N/A"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Status:</span>
                                  <span className="text-green-600 font-semibold">
                                    {log.message?.metadata?.statusCode || "N/A"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Show full metadata dynamically */}
                          <div className="bg-white mt-6 rounded-lg p-4 border border-blue-100">
                            <h3 className="text-gray-900 font-semibold flex items-center gap-2 mb-3">
                              <FileText className="w-4 h-4 text-blue-600" />
                              Metadata
                            </h3>

                            {/* Dark JSON Block */}
                            <div className="bg-gray-900/95 text-gray-100 rounded-md p-4 font-mono text-sm border border-gray-700">
                              <pre className="overflow-x-auto">
                                <code>
                                  {"{\n"}
                                  {Object.entries(
                                    log.message?.metadata || {}
                                  ).map(([key, value], index, arr) => {
                                    const isObject =
                                      typeof value === "object" &&
                                      value !== null;
                                    const isNumber = typeof value === "number";
                                    const isBoolean =
                                      typeof value === "boolean";

                                    let formattedValue;
                                    if (isObject) {
                                      formattedValue = (
                                        <span className="text-yellow-400">
                                          {JSON.stringify(value, null, 2)}
                                        </span>
                                      );
                                    } else if (isNumber) {
                                      formattedValue = (
                                        <span className="text-purple-400">
                                          {value}
                                        </span>
                                      );
                                    } else if (isBoolean) {
                                      formattedValue = (
                                        <span className="text-orange-400">
                                          {String(value)}
                                        </span>
                                      );
                                    } else {
                                      formattedValue = (
                                        <span className="text-green-400">
                                          "{value}"
                                        </span>
                                      );
                                    }

                                    return (
                                      <div key={key}>
                                        &nbsp;&nbsp;
                                        <span className="text-blue-400">
                                          "{key}"
                                        </span>
                                        <span className="text-gray-400">
                                          :{" "}
                                        </span>
                                        {formattedValue}
                                        {index < arr.length - 1 ? (
                                          <span className="text-gray-400">
                                            ,
                                          </span>
                                        ) : (
                                          ""
                                        )}
                                      </div>
                                    );
                                  })}
                                  {"}"}
                                </code>
                              </pre>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="8"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No audit logs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {logsList?.data?.pagination &&
          logsList?.data?.pagination?.totalItems > 0 && (
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <span className="text-sm text-slate-600">
                  Showing {getShowingFrom()} to {getShowingTo()} of{" "}
                  {logsList.data.pagination.totalItems} logs
                </span>

                {/* Use Pagination Component */}
                <Pagination
                  currentPage={currentPage}
                  totalPages={logsList.data.pagination.totalPages}
                  onPageChange={setCurrentPage}
                />

                <span className="text-xs text-slate-500">
                  Last updated: {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default AuditLogs;
