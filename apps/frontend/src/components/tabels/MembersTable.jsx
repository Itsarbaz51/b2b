// MembersTable.js
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Search,
  User,
  Phone,
  Mail,
  Wallet,
  Users,
  X,
  MoreVertical,
  Eye,
  EyeOff,
  RefreshCw,
  UsersRound,
  UserRound,
} from "lucide-react";
import { toast } from "react-toastify";
import AddMember from "../forms/AddMember";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllBusinessUsersByParentId,
  setCurrentUser,
  clearUserError,
  clearUserSuccess,
  deactivateUser,
  reactivateUser,
  deleteUser,
} from "../../redux/slices/userSlice";

import HeaderSection from "../ui/HeaderSection";
import ButtonField from "../ui/ButtonField";
import ConfirmCard from "../ui/ConfirmCard";
import Pagination from "../ui/Pagination";
import EmptyState from "../ui/EmptyState";
import ActionsMenu from "../ui/ActionsMenu";
import UserProfileView from "../../pages/view/UserProfileView";
import EditCredentialsModal from "../forms/EditCredentialsModal";
import EditProfileImageModal from "../forms/EditProfileImageModal";
import AddPermission from "../forms/AddPermission";
import {
  getPermissionById,
  upsertPermission,
} from "../../redux/slices/permissionSlice";
import { allServices } from "../../redux/slices/serviceSlice";
import { login } from "../../redux/slices/authSlice";

const MembersTable = () => {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showViewProfile, setShowViewProfile] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showEditPin, setShowEditPin] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [showPins, setShowPins] = useState({});

  const dispatch = useDispatch();
  const searchTimeoutRef = useRef(null);
  const initialLoadRef = useRef(false);

  // --- Permission Modal States ---
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionUser, setPermissionUser] = useState(null);
  const [existingPermissions, setExistingPermissions] = useState([]);
  const [permissionMode, setPermissionMode] = useState("add");

  // Users state
  const usersState = useSelector((state) => state.users || {});

  //  CURRENT LOGGED-IN USER ka data get karo
  const authState = useSelector((state) => state.auth || {});
  const currentLoggedInUser = authState.currentUser || {};
  const currentUserRole = currentLoggedInUser?.role || "";

  const {
    users = [],
    isLoading = false,
    currentUser: viewedUser = null,
    pagination,
    error: userError,
    success: userSuccess,
  } = usersState;

  const currentPage = pagination.page || 1;
  const totalPages = pagination.totalPages || 0;
  const totalUsers = pagination.total || 0;
  const limit = pagination.limit || 10;

  const services =
    useSelector((state) => state.services.serviceProviders.allActiveServices) ||
    [];

  //  Check if current user is ADMIN
  const isAdminUser =
    currentUserRole?.name === "ADMIN" || currentUserRole.type === "employee";

  //  FIXED: Correct loadUsers function
  const loadUsers = useCallback(
    async (page = 1, searchTerm = "", forceRefresh = false) => {
      try {
        const params = {
          page,
          limit,
          sort: "desc",
          status: "ALL",
        };

        if (searchTerm && searchTerm.trim() !== "") {
          params.search = searchTerm;
        }

        if (forceRefresh) {
          params.timestamp = Date.now();
        }

        await dispatch(getAllBusinessUsersByParentId(params));
      } catch (error) {
        console.error("Failed to load users:", error);
        toast.error(error.message || "Failed to load users");
      }
    },
    [dispatch, limit]
  );

  //  FIXED: Page change handler
  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) {
        loadUsers(page, search);
      }
    },
    [totalPages, loadUsers, search]
  );

  //  FIXED: Manual refresh
  const handleManualRefresh = useCallback(() => {
    loadUsers(1, search, true);
    toast.info("Refreshing data...");
  }, [loadUsers, search]);

  // Toast handling
  useEffect(() => {
    if (userError) {
      toast.error(userError);
      dispatch(clearUserError());
    }

    if (userSuccess) {
      const lowerSuccess = userSuccess.toLowerCase();
      const isGenericSuccess = ![
        "registered",
        "updated",
        "created",
        "added",
        "activated",
        "deactivated",
      ].some((word) => lowerSuccess.includes(word));

      if (isGenericSuccess) {
        toast.success(userSuccess);
      }
      dispatch(clearUserSuccess());
    }
  }, [userError, userSuccess, dispatch]);

  //  FIXED: Initial load only once
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadUsers();
    }
  }, [loadUsers]);

  //  FIXED: Search with debouncing
  useEffect(() => {
    if (!initialLoadRef.current) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadUsers(1, search);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, loadUsers]);

  // Permission effect
  useEffect(() => {
    if (showPermissionModal && permissionUser?.id) {
      dispatch(getPermissionById(permissionUser?.id))
        .then((result) => {
          if (result?.data) {
            setExistingPermissions(result.data);
          }
        })
        .catch((error) => {
          setExistingPermissions([]);
        });
    }
  }, [dispatch, showPermissionModal, permissionUser]);

  // Service providers effect
  useEffect(() => {
    if (showPermissionModal) {
      dispatch(allServices("active"));
    }
  }, [showPermissionModal, dispatch]);

  // Open Permission Modal
  const handleAddPermission = async (user) => {
    setPermissionUser(user);

    try {
      const result = await dispatch(getPermissionById(user?.id));

      if (
        result?.data &&
        Array.isArray(result.data) &&
        result.data.length > 0
      ) {
        setPermissionMode("edit");
        setExistingPermissions(result.data);
      } else {
        setPermissionMode("add");
        setExistingPermissions([]);
      }
    } catch (error) {
      setPermissionMode("add");
      setExistingPermissions([]);
    }

    setShowPermissionModal(true);
  };

  // Submit Permission
  const handlePermissionSubmit = (permissionData) => {
    if (!permissionUser) return;

    const finalData = {
      userId: permissionUser?.id,
      ...permissionData,
    };

    dispatch(upsertPermission(finalData))
      .then(() => {
        toast.success(
          `Permissions ${
            permissionMode === "add" ? "added" : "updated"
          } successfully!`
        );
        handleClosePermissionModal();
        handleManualRefresh();
      })
      .catch((error) => {
        toast.error(error.message || "Failed to update permissions");
      });
  };

  // Close Modal
  const handleClosePermissionModal = () => {
    setShowPermissionModal(false);
    setPermissionUser(null);
    setPermissionMode("add");
    setExistingPermissions([]);
  };

  // Role colors and display names
  const getRoleColor = (roleName) => {
    const role = roleName?.toUpperCase();
    switch (role) {
      case "STATE HEAD":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "STATE HOLDER":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "MASTER DISTRIBUTOR":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "DISTRIBUTOR":
        return "bg-green-100 text-green-800 border-green-300";
      case "AGENT":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "RETAILER":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getRoleDisplayName = (roleName) => {
    const role = roleName?.toUpperCase();
    switch (role) {
      case "STATE HEAD":
        return "State Head";
      case "STATE HOLDER":
        return "State Holder";
      case "MASTER DISTRIBUTOR":
        return "Master Distributor";
      case "DISTRIBUTOR":
        return "Distributor";
      case "AGENT":
        return "Agent";
      case "RETAILER":
        return "Retailer";
      default:
        return roleName || "Unknown";
    }
  };

  const togglePasswordVisibility = (userId) => {
    setShowPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const togglePinVisibility = (userId) => {
    setShowPins((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleLogin = async (user) => {
    const payload = {
      emailOrUsername: user.username.trim(),
      password: user.password.trim(),
    };

    try {
      await dispatch(login(payload));
      toast.success(`Logged in as ${user?.username}`);
    } catch (err) {
      console.error("Login failed:", err);
      toast.error("Login failed!");
    }
  };

  const confirmAction = async (reason) => {
    if (actionType && selectedUser) {
      try {
        const finalReason = reason?.trim() || `${actionType}d by admin`;

        if (actionType === "Deactivate") {
          await dispatch(
            deactivateUser({
              userId: selectedUser?.id,
              reason: finalReason,
            })
          );
        } else if (actionType === "Activate") {
          await dispatch(
            reactivateUser({
              userId: selectedUser?.id,
              reason: finalReason,
            })
          );
        } else if (actionType === "Delete") {
          await dispatch(
            deleteUser({
              userId: selectedUser?.id,
              reason: finalReason,
            })
          );
        }

        toast.success(`User ${actionType.toLowerCase()}d successfully!`);

        setTimeout(() => {
          handleManualRefresh();
        }, 500);
      } catch (error) {
        console.error(`Failed to ${actionType.toLowerCase()} user:`, error);
        toast.error(
          error.message || `Failed to ${actionType.toLowerCase()} user`
        );
      }
    }
    setShowActionModal(false);
    setSelectedUser(null);
    setActionType("");
  };

  // View user
  const handleViewUser = async (user) => {
    setSelectedUser(user);
    setShowViewProfile(true);
  };

  // Form handlers
  const handleFormClose = () => {
    setShowForm(false);
    setSelectedUser(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedUser(null);
    handleManualRefresh();
    toast.success(
      selectedUser ? "User updated successfully!" : "User added successfully!"
    );
  };

  const handleEditProfileSuccess = () => {
    setShowEditProfile(false);
    setSelectedUser(null);
    handleManualRefresh();
    toast.success("Profile image updated successfully!");
  };

  const handleCredentialsSuccess = () => {
    setShowEditPassword(false);
    setShowEditPin(false);
    setSelectedUser(null);
    handleManualRefresh();
    toast.success("Credentials updated successfully!");
  };

  // Filter users safely
  const filteredUsers = Array.isArray(users)
    ? users.filter(
        (user) =>
          user?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
          user?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
          user?.email?.toLowerCase().includes(search.toLowerCase()) ||
          user?.phoneNumber?.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  return (
    <div>
      <HeaderSection
        title="Members Management"
        tagLine="Manage your team members and their access levels"
        icon={Users}
        totalCount={`${totalUsers || 0} Members`}
      />

      {/* Search + Add Member */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Team Members
            </h2>
            <p className="text-gray-600">Manage and monitor your team</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search members..."
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-gray-50 focus:bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className={`px-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2 transition-colors ${
                isLoading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900"
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>

            <ButtonField
              name="Add Member"
              isOpen={() => {
                setSelectedUser(null);
                setShowForm(true);
              }}
              icon={Users}
              css
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white w-full rounded-xl h-full shadow-lg border border-gray-300 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                #
              </th>
              <th className="px-2 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Member
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Username
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Contact
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Role
              </th>
              {isAdminUser && (
                <>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                    Password
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                    Transaction PIN
                  </th>
                </>
              )}

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Wallet
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Status
              </th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={isAdminUser ? 10 : 8}>
                  <EmptyState type="loading" />
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={isAdminUser ? 10 : 8}>
                  <EmptyState
                    type={search ? "search" : "empty"}
                    search={search}
                  />
                </td>
              </tr>
            ) : (
              filteredUsers.map((user, index) => (
                <tr key={user?.id} className="hover:bg-blue-50 transition-all">
                  <td className="px-6 py-5">
                    {(currentPage - 1) * limit + index + 1}
                  </td>

                  <td className="px-1 py-5">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                        onClick={() =>
                          user?.profileImage &&
                          setPreviewImage(user?.profileImage)
                        }
                      >
                        {user?.profileImage ? (
                          <img
                            src={user?.profileImage}
                            alt={user?.firstName || "User"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-600" />
                        )}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-900 mb-1">
                          {`${user?.firstName || ""} ${
                            user?.lastName || ""
                          }`.trim()}
                        </p>
                        <div className="flex items-center text-xs text-gray-500">
                          <Mail className="w-3 h-3 mr-1" />
                          {user?.email || "No email"}
                        </div>
                        <div className="flex items-center text-xs text-gray-500">
                          <UsersRound className="w-3 h-3 mr-1" />
                          Parent: {user?.parent?.username || ""}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-sm text-gray-700">
                    <div className="flex items-center">
                      <UserRound className="w-4 h-4 mr-2 text-gray-400" />
                      {user?.username || "No phone"}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-gray-700">
                    <div className="flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-400" />
                      {user?.phoneNumber || "No phone"}
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(
                        user?.role?.name
                      )}`}
                    >
                      {getRoleDisplayName(user?.role?.name)}
                    </span>
                  </td>

                  {isAdminUser && (
                    <>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono">
                            {showPasswords[user?.id]
                              ? user?.password
                              : "••••••••"}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(user?.id)}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                            title={showPasswords[user?.id] ? "Hide" : "Show"}
                          >
                            {showPasswords[user?.id] ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-mono">
                            {showPins[user?.id]
                              ? user?.transactionPin
                              : "••••••"}
                          </span>
                          <button
                            onClick={() => togglePinVisibility(user?.id)}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                            title={showPins[user?.id] ? "Hide" : "Show"}
                          >
                            {showPins[user?.id] ? (
                              <EyeOff size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                    </>
                  )}

                  <td className="px-6 py-5">
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-4 h-4 text-gray-400" />
                      <span
                        className={`text-sm font-semibold ${
                          (user?.wallets?.[0]?.balance || 0) > 0
                            ? "text-green-600"
                            : "text-red-500"
                        }`}
                      >
                        ₹
                        {(user?.wallets?.[0]?.balance || 0).toLocaleString() ||
                          0}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
                        user?.status === "IN_ACTIVE"
                          ? "bg-red-100 text-red-800 border-red-300"
                          : user?.status === "ACTIVE"
                          ? "bg-green-100 text-green-800 border-green-300"
                          : user?.status === "DELETE"
                          ? "bg-gray-100 text-gray-800 border-gray-300"
                          : "bg-yellow-100 text-yellow-800 border-yellow-300"
                      }`}
                    >
                      {user?.status === "IN_ACTIVE"
                        ? "Inactive"
                        : user?.status === "ACTIVE"
                        ? "Active"
                        : user?.status === "DELETE"
                        ? "Deleted"
                        : user?.status || "Unknown"}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-center relative">
                    <div className="inline-block relative">
                      <button
                        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === user?.id ? null : user?.id
                          )
                        }
                      >
                        {openMenuId === user?.id ? (
                          <X className="w-5 h-5 text-gray-600" />
                        ) : (
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        )}
                      </button>

                      {openMenuId === user?.id && (
                        <ActionsMenu
                          user={user}
                          isAdminUser={isAdminUser}
                          onView={handleViewUser}
                          onEdit={(user) => {
                            setSelectedUser(user);
                            setShowForm(true);
                            setOpenMenuId(null);
                          }}
                          onEditProfile={(user) => {
                            setSelectedUser(user);
                            setShowEditProfile(true);
                            setOpenMenuId(null);
                          }}
                          onEditPassword={(user) => {
                            setSelectedUser(user);
                            setShowEditPassword(true);
                            setOpenMenuId(null);
                          }}
                          onEditPin={(user) => {
                            setSelectedUser(user);
                            setShowEditPin(true);
                            setOpenMenuId(null);
                          }}
                          onPermission={(user) => {
                            handleAddPermission(user);
                            setOpenMenuId(null);
                          }}
                          onToggleStatus={(user) => {
                            setActionType(
                              user?.status === "IN_ACTIVE"
                                ? "Activate"
                                : "Deactivate"
                            );
                            setSelectedUser(user);
                            setShowActionModal(true);
                            setOpenMenuId(null);
                          }}
                          onDelete={(user) => {
                            setActionType("Delete");
                            setSelectedUser(user);
                            setShowActionModal(true);
                            setOpenMenuId(null);
                          }}
                          onLogin={handleLogin}
                          onClose={() => setOpenMenuId(null)}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages >= 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      {/* Profile Modal */}
      {showViewProfile && selectedUser && (
        <UserProfileView
          userId={selectedUser.id}
          isAdminUser={isAdminUser}
          onClose={() => {
            setShowViewProfile(false);
            dispatch(setCurrentUser(null));
          }}
          type="business"
        />
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 flex justify-center items-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-[90%] max-h-[85%]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white text-3xl font-bold hover:text-gray-300 transition-colors"
            >
              ×
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-[50vh] rounded-lg shadow-lg object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && (
        <ConfirmCard
          actionType={actionType}
          user={selectedUser}
          isClose={() => setShowActionModal(false)}
          isSubmit={confirmAction}
          predefinedReasons={[
            "Violation of terms of service",
            "Inappropriate behavior",
            "Security concerns",
            "User request",
            "Suspicious activity",
            "Account verification required",
            "Other",
          ]}
        />
      )}

      {/* Add/Edit Member Modal */}
      {showForm && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <AddMember
            onClose={handleFormClose}
            onSuccess={handleFormSuccess}
            editData={selectedUser}
            isAdmin={isAdminUser}
            type={"business"}
          />
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && selectedUser && (
        <EditProfileImageModal
          user={selectedUser}
          onClose={() => {
            setShowEditProfile(false);
            setSelectedUser(null);
          }}
          onSuccess={handleEditProfileSuccess}
          type="business"
        />
      )}

      {/* Edit Password Modal */}
      {showEditPassword && selectedUser && (
        <EditCredentialsModal
          userId={selectedUser?.id}
          type="password"
          onClose={() => {
            setShowEditPassword(false);
            setSelectedUser(null);
          }}
          onSuccess={handleCredentialsSuccess}
        />
      )}

      {/* Edit PIN Modal */}
      {showEditPin && selectedUser && (
        <EditCredentialsModal
          userId={selectedUser?.id}
          type="pin"
          onClose={() => {
            setShowEditPin(false);
            setSelectedUser(null);
          }}
          onSuccess={handleCredentialsSuccess}
        />
      )}

      {/* Permission Modal */}

      {showPermissionModal && permissionUser && (
        <AddPermission
          mode={permissionMode}
          onSubmit={handlePermissionSubmit}
          onCancel={handleClosePermissionModal}
          selectedUser={permissionUser}
          services={services}
          setSelectedUser={setPermissionUser}
          existingPermissions={existingPermissions}
        />
      )}
    </div>
  );
};

export default MembersTable;
