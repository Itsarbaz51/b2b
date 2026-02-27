import { AlertCircle, UserX, Lock, LogOut } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../redux/slices/authSlice";

export default function UnauthorizedPage() {
  const { currentUser } = useSelector((state) => state.auth);

  const deactivationReason = currentUser.deactivationReason;
  const userStatus = currentUser.status;

  const dispatch = useDispatch();

  const handleLogout = () => {
    dispatch(logout());
  };

  const renderContent = () => {
    if (userStatus === "IN_ACTIVE") {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 mb-4">
                <UserX className="w-10 h-10 text-orange-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Account Deactivated
              </h1>
              <p className="text-gray-600">
                Your account has been temporarily deactivated
              </p>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-orange-900 mb-1">
                Reason for Deactivation:
              </p>
              <p className="text-sm text-orange-700">
                {deactivationReason || "No reason provided"}
              </p>
            </div>

            <div className="text-left space-y-3 mb-6">
              <p className="text-sm text-gray-700">
                <strong>What this means:</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-2 ml-4">
                <li>• Your account access has been temporarily suspended</li>
                <li>• You cannot log in or use platform features</li>
                <li>• Your data is preserved and can be restored</li>
              </ul>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-gray-700 mb-4">
                To reactivate your account, please contact:
              </p>
              <div className="space-y-2">
                <a
                  href={`https://mail.google.com/mail/?view=cm&to=${import.meta.env.VITE_SMTP_USER}.com&su=Support%20Request&body=Hello%20Admin,%0D%0A%0D%0AI%20need%20assistance%20with%20...`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Contact Support
                </a>
                <button
                  onClick={handleLogout}
                  className=" w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center "
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (userStatus === "DELETE") {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-gray-100 p-6">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Account Deleted
              </h1>
              <p className="text-gray-600">
                This account has been permanently deleted
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-red-900 mb-1">
                Reason for Deletion:
              </p>
              <p className="text-sm text-red-700">
                {deactivationReason || "No reason provided"}
              </p>
            </div>

            <div className="text-left space-y-3 mb-6">
              <p className="text-sm text-gray-700">
                <strong>What this means:</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-2 ml-4">
                <li>• Your account has been permanently removed</li>
                <li>• This action cannot be reversed</li>
                <li>• All access has been revoked by an administrator</li>
              </ul>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-gray-700 mb-4">
                If you believe this was done in error:
              </p>
              <div className="space-y-2">
                <a
                  href="https://mail.google.com/mail/?view=cm&to=admin@example.com&su=Support%20Request&body=Hello%20Admin,%0D%0A%0D%0AI%20need%20assistance%20with%20..."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                >
                  Contact Administrator
                </a>
                <button
                  onClick={handleLogout}
                  className=" w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center "
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return renderContent();
}
