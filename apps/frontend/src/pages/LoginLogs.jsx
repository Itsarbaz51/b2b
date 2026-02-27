import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  MapPin,
  RefreshCw,
  Monitor,
  Smartphone,
  Filter,
  ChevronDown,
  Globe,
  User,
  ArrowUpDown,
  Building2,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useDebounce } from "use-debounce";
import { getLoginLogs } from "../redux/slices/logsSlice";
import { getAllRoles } from "../redux/slices/roleSlice";
import RefreshToast from "../components/ui/RefreshToast";
import Pagination from "../components/ui/Pagination";

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 400;

const LoginLogs = () => {
  const dispatch = useDispatch();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deviceFilterOpen, setDeviceFilterOpen] = useState(false);
  const [roleFilterOpen, setRoleFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedSort, setSelectedSort] = useState("");
  const [selectedSortBy, setSelectedSortBy] = useState("");

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const [debouncedSearch] = useDebounce(searchTerm, DEBOUNCE_DELAY);

  // Redux data
  const { logsList = {}, loading } = useSelector((state) => state.logs);
  const { currentUser } = useSelector((state) => state.auth);

  const isAdmin = useMemo(
    () => currentUser.role?.name === "ADMIN",
    [currentUser]
  );
  const pagination = logsList?.metadata?.pagination;
  const summary = logsList?.summary || {};

  const roles = useSelector((state) => state?.roles?.roles || []);

  useEffect(() => {
    if (isAdmin) {
      dispatch(getAllRoles());
    }
  }, [dispatch, isAdmin]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      selectedDevice !== "" ||
      selectedRole !== "" ||
      selectedSort !== "" ||
      selectedSortBy !== "" ||
      searchTerm !== ""
    );
  }, [selectedDevice, selectedRole, selectedSort, selectedSortBy, searchTerm]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSelectedDevice("");
    setSelectedRole("");
    setSelectedSort("");
    setSelectedSortBy("");
    setSearchTerm("");
    setCurrentPage(1);
  }, []);

  // Fetch logs
  const fetchLoginLogs = useCallback(
    async (showLoading = false) => {
      if (showLoading) setIsRefreshing(true);
      try {
        const params = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          search: debouncedSearch,
          deviceType: selectedDevice || "all",
          roleId: selectedRole !== "all" ? selectedRole : undefined,
          sort: selectedSort,
        };

        await dispatch(getLoginLogs(params));
      } catch (error) {
        console.error("Failed to fetch login logs:", error);
      } finally {
        if (showLoading) setIsRefreshing(false);
      }
    },
    [
      dispatch,
      currentPage,
      debouncedSearch,
      selectedDevice,
      selectedRole,
      selectedSort,
    ]
  );

  useEffect(() => {
    fetchLoginLogs();
  }, [fetchLoginLogs]);

  // Helpers
  const getInitials = (first, last) =>
    `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";

    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;

    const minutes = Math.floor(diffInMs / (1000 * 60));
    const hours = Math.floor(diffInMs / (1000 * 60 * 60));
    const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30);

    if (minutes < 1) {
      return "Just now";
    } else if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days === 1) {
      return "1 day ago";
    } else if (days < 7) {
      return `${days}d ago`;
    } else if (weeks === 1) {
      return "1 week ago";
    } else if (weeks < 4) {
      return `${weeks}w ago`;
    } else if (months === 1) {
      return "1 month ago";
    } else if (months < 12) {
      return `${months}mo ago`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };

  const getFullTimestamp = (timestamp) =>
    new Date(timestamp).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const DeviceIcon = ({ device }) =>
    device?.toLowerCase() === "mobile" ? (
      <Smartphone className="h-4 w-4" />
    ) : (
      <Monitor className="h-4 w-4" />
    );

  // Filtered data - use the data directly from API (already filtered on backend)
  const filteredData = useMemo(() => {
    return Array.isArray(logsList?.data) ? logsList.data : [];
  }, [logsList?.data]);

  const handleRefresh = () => fetchLoginLogs(true);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    fetchLoginLogs();
  };

  const handleDeviceFilterChange = (device) => {
    setSelectedDevice(device);
    setCurrentPage(1);
    setDeviceFilterOpen(false);
  };

  const handleRoleFilterChange = (roleId) => {
    setSelectedRole(roleId);
    setCurrentPage(1);
    setRoleFilterOpen(false);
  };

  return (
    <div>
      {/* Summary cards */}
      {summary?.totalLogs !== undefined && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Logs",
              value: summary.totalLogs,
              icon: Globe,
              color: "blue",
            },
            {
              label: "Desktop",
              value: summary.desktopLogs,
              icon: Monitor,
              color: "purple",
            },
            {
              label: "Mobile",
              value: summary.mobileLogs,
              icon: Smartphone,
              color: "green",
            },
            {
              label: "Unique Users",
              value: summary.uniqueUsers,
              icon: null,
              emoji: "👤",
              color: "orange",
            },
          ].map(({ label, value, icon: Icon, emoji, color }) => (
            <div
              key={label}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{label}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {value ?? 0}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 rounded-xl ${
                    color === "blue"
                      ? "bg-blue-100"
                      : color === "purple"
                      ? "bg-purple-100"
                      : color === "green"
                      ? "bg-green-100"
                      : "bg-orange-100"
                  } flex items-center justify-center`}
                >
                  {Icon ? (
                    <Icon
                      className={`h-6 w-6 ${
                        color === "blue"
                          ? "text-blue-600"
                          : color === "purple"
                          ? "text-purple-600"
                          : color === "green"
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    />
                  ) : (
                    <span className="text-2xl">{emoji}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search users, IPs, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div className="flex gap-3">
            {/* Device Filter */}
            <div className="relative">
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
                    {["all", "desktop", "mobile"].map((device) => (
                      <button
                        key={device}
                        onClick={() => handleDeviceFilterChange(device)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedDevice === device
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {device.charAt(0).toUpperCase() + device.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Role Filter */}
            {isAdmin && (
              <div className="relative">
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
                        onClick={() => handleRoleFilterChange("all")}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedRole === "all"
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        All Roles
                      </button>
                      {roles.map((role) => (
                        <button
                          key={role.id}
                          onClick={() => handleRoleFilterChange(role.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedRole === role.id
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
            <div className="relative">
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="inline-flex items-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium"
              >
                <ArrowUpDown className="h-4 w-4" />
                {selectedSort ? selectedSort.toUpperCase() : "Sort"}
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
                        onClick={() => {
                          setSelectedSort(order);
                          setSortOpen(false);
                          fetchLoginLogs();
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedSort === order
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
            <RefreshToast isLoading={isRefreshing} onClick={handleRefresh} />

            {/* Clear Filters Button - Only show when filters are active */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-2 px-4 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 text-sm font-medium"
              >
                <X className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {[
                  "User",
                  "Role",
                  "Role Type",
                  "Device & Browser",
                  "IP",
                  "Location",
                  "Time",
                  "Actions",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Loading logs...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No logs found
                  </td>
                </tr>
              ) : (
                filteredData.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(log.user?.firstName, log.user?.lastName)}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">
                            {log.user?.firstName} {log.user?.lastName}
                          </div>
                          <div className="text-xs text-slate-500">
                            {log.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {log.user?.role?.name || "N/A"}
                          </div>
                          <div className="text-xs text-slate-500">
                            Level {log.user?.role?.level || 0}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                          {log.roleType === "employee" ? (
                            <User className="h-4 w-4" />
                          ) : log.roleType === "business" ? (
                            <Building2 className="h-4 w-4" />
                          ) : (
                            <User className="h-4 w-4" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {log.roleType || "N/A"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                          <DeviceIcon device={log.userAgentSimple?.device} />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {log.userAgentSimple?.browser || "Unknown"}
                          </div>
                          <div className="text-xs text-slate-500">
                            {log.userAgentSimple?.os || ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-800">
                      {log.ipAddress || "N/A"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400 flex-shrink-0" />
                        <button
                          className="text-left hover:text-blue-600 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedLocation(log.location);
                            setShowLocationModal(true);
                          }}
                        >
                          {log.location
                            ? log.location.length > 10
                              ? `${log.location.substring(0, 10)}...`
                              : log.location
                            : "Unknown"}
                        </button>
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 text-sm"
                      title={getFullTimestamp(log.createdAt)}
                    >
                      {formatTimestamp(log.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() =>
                          log.latitude &&
                          window.open(
                            `https://www.google.com/maps?q=${log.latitude},${log.longitude}`,
                            "_blank"
                          )
                        }
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition"
                      >
                        <MapPin className="h-4 w-4" />
                        View Map
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer & Pagination */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
          {/* Use Pagination Component */}
          {pagination && pagination.totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          )}

          <span className="text-xs text-slate-500">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      <LocationModal
        location={selectedLocation}
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </div>
  );
};

export default LoginLogs;

const LocationModal = ({ location, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            Location Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-4">
          <p className="text-sm text-slate-600 mb-1">Full Location:</p>
          <p className="text-lg font-medium text-slate-900 break-words">
            {location || "Unknown Location"}
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          {location && location !== "Unknown" && (
            <button
              onClick={() => {
                window.open(
                  `https://www.google.com/maps?q=${location}`,
                  "_blank"
                );
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <MapPin className="h-4 w-4" />
              Open in Maps
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
