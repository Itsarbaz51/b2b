import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  X,
  Edit,
  Camera,
  Lock,
  Mail,
  Key,
} from "lucide-react";
import { updateUserProfileImage } from "../redux/slices/userSlice";
import { logout, passwordReset } from "../redux/slices/authSlice";
import ForgotCredentialsModal from "../components/forms/ForgotCredentialsModal";
import AddMember from "../components/forms/AddMember";
import EditCredentialsModal from "../components/forms/EditCredentialsModal";

const UserProfilePage = ({ onClose }) => {
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);

  const { currentUser, isLoading: userLoading } = useSelector(
    (state) => state.users
  );
  const { currentUser: authUser } = useSelector((state) => state.auth);

  const userData = currentUser || authUser;
  const currentUserRole = userData?.role?.name || "";
  const isAdminUser = currentUserRole === "ADMIN";

  const handleProfileImageUpdate = async (file) => {
    try {
      setLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append("profileImage", file);

      await dispatch(updateUserProfileImage(userData.id, formData));
      setSuccess("Profile image updated successfully!");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdateSuccess = () => {
    setSuccess("Profile updated successfully!");
    setShowProfileModal(false);
  };

  const handleCredentialsUpdateSuccess = () => {
    setSuccess("Credentials updated successfully! Redirecting to login...");
    setShowPasswordModal(false);
    setShowPinModal(false);

    setTimeout(() => {
      dispatch(logout());
    }, 1000);
  };

  const handleForgotPasswordAndPin = async (email) => {
    try {
      setLoading(true);
      setError(null);

      if (!email) {
        setError("Email address is required");
        return;
      }

      await dispatch(passwordReset(email));
      setForgotPasswordMode(false);
      setSuccess(
        "Password reset link sent to your email! Please check your inbox."
      );

      dispatch(logout());
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const getStatusBadge = (status) => {
    const statusMap = {
      ACTIVE: { bg: "bg-green-100", text: "text-green-800", icon: CheckCircle },
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", icon: Clock },
      IN_ACTIVE: { bg: "bg-red-100", text: "text-red-800", icon: XCircle },
      DELETE: { bg: "bg-gray-100", text: "text-gray-800", icon: XCircle },
    };

    const statusConfig = statusMap[status] || statusMap.IN_ACTIVE;
    const IconComponent = statusConfig.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
      >
        <IconComponent className="w-3 h-3 mr-1" />
        {status || "Unknown"}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (loading || userLoading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading user profile...</span>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        No user data found.
      </div>
    );
  }

  const ProfileImageSection = () => (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <div className="flex items-center space-x-6">
        <div className="relative">
          <img
            src={userData.profileImage || "/default-avatar.png"}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
          />
          <label
            htmlFor="profileImage"
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors"
          >
            <Camera className="w-4 h-4" />
            <input
              id="profileImage"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleProfileImageUpdate(file);
              }}
            />
          </label>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {userData.firstName} {userData.lastName}
          </h1>
          <p className="text-gray-500">{userData.email}</p>
          <div className="mt-2 flex items-center space-x-4">
            {getStatusBadge(userData.status)}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              <Shield className="w-3 h-3 mr-1" />
              {userData.role?.name || "N/A"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          {authUser?.role?.type !== "employee" && (
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {userData.wallets?.[0]
                  ? formatCurrency(userData.wallets[0].balance)
                  : "₹0.00"}
              </div>
              <div className="text-xs text-gray-500">Balance</div>
            </div>
          )}
          <div>
            <div className="text-2xl font-bold text-green-600">
              {userData.children?.length || 0}
            </div>
            <div className="text-xs text-gray-500">Children</div>
          </div>
          {authUser?.role?.type !== "employee" && (
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {userData.kycInfo?.isKycSubmitted ? "Verified" : "Pending"}
              </div>
              <div className="text-xs text-gray-500">KYC</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ProfileInformationSection = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <User className="w-5 h-5 mr-2 text-gray-600" />
          Profile Information
        </h2>
        <button
          onClick={() => setShowProfileModal(true)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
        >
          <Edit className="w-4 h-4" />
          <span>Edit Profile</span>
        </button>
      </div>

      <div className="px-6 py-4">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                First Name
              </label>
              <p className="mt-1 text-sm text-gray-900 font-medium">
                {userData.firstName}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Last Name
              </label>
              <p className="mt-1 text-sm text-gray-900 font-medium">
                {userData.lastName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Username
              </label>
              <p className="mt-1 text-sm text-gray-900 font-medium">
                {userData.username}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500">
                Phone Number
              </label>
              <p className="mt-1 text-sm text-gray-900 font-medium">
                {userData.phoneNumber}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500">
              Email
            </label>
            <p className="mt-1 text-sm text-gray-900 font-medium">
              {userData.email}
            </p>
            {!isAdminUser && (
              <p className="text-xs text-gray-500 mt-1">
                Contact administrator to change email address
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                User ID
              </label>
              <p className="mt-1 text-sm text-gray-900 font-mono">
                {userData.id}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Role
              </label>
              <p className="mt-1 text-sm text-gray-900 font-medium">
                {userData.role?.name} - {userData.role?.description}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Created At
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {formatDate(userData.createdAt)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">
                Last Updated
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {formatDate(userData.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const CredentialsSection = () => (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-300 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <Lock className="w-5 h-5 mr-2 text-gray-600" />
          Security & Credentials
        </h2>
      </div>

      <div className="px-6 py-4">
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <Lock className="w-4 h-4 mr-2" />
              Password Management
            </h3>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Change Password</span>
                </button>
                <button
                  onClick={() => setForgotPasswordMode(true)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors border border-blue-600 px-4 py-2 rounded-md"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Password and PIN Reset Links</span>
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Use "Send Password Reset Link" to receive a reset token via
                email, then use "Change Password" to set a new password.
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <Key className="w-4 h-4 mr-2" />
              Transaction PIN
            </h3>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowPinModal(true)}
                  className="flex items-center space-x-2 bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Change Transaction PIN</span>
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Your 4-digit transaction PIN is used for secure financial
                transactions. Keep it confidential and change it regularly for
                security.
              </p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h4 className="text-sm font-semibold text-yellow-800 mb-2">
              Security Tips
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>
                • Use a strong, unique password with letters, numbers, and
                symbols
              </li>
              <li>• Never share your password or PIN with anyone</li>
              <li>• Change your password regularly</li>
              <li>• Use a different PIN than your other accounts</li>
              <li>• Log out from shared devices</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-50 w-full min-h-screen rounded-2xl py-4 px-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">{success}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center space-x-2 text-red-800">
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Error: {error}</span>
          </div>
        </div>
      )}

      <ProfileImageSection />

      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("profile")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "profile"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab("credentials")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "credentials"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            <Lock className="w-4 h-4 inline mr-2" />
            Security & Credentials
          </button>
        </nav>
      </div>

      <div>
        {activeTab === "profile" && <ProfileInformationSection />}
        {activeTab === "credentials" && <CredentialsSection />}
      </div>

      {showProfileModal && (
        <AddMember
          onClose={() => setShowProfileModal(false)}
          onSuccess={handleProfileUpdateSuccess}
          editData={userData}
          isAdmin={isAdminUser}
          profileEdit={true}
        />
      )}

      {showPasswordModal && (
        <EditCredentialsModal
          userId={userData.id}
          type="password"
          onClose={() => setShowPasswordModal(false)}
          onSuccess={handleCredentialsUpdateSuccess}
        />
      )}

      {showPinModal && (
        <EditCredentialsModal
          userId={userData.id}
          type="pin"
          onClose={() => setShowPinModal(false)}
          onSuccess={handleCredentialsUpdateSuccess}
        />
      )}

      {forgotPasswordMode && (
        <ForgotCredentialsModal
          setForgotMode={setForgotPasswordMode}
          handleForgotCredentials={handleForgotPasswordAndPin}
          forgotForm={{ email: userData?.email || "" }}
          setForgotForm={() => {}}
          loading={loading}
          userData={userData}
        />
      )}
    </div>
  );
};

export default UserProfilePage;
