import { AlertCircle, Lock, LogOut } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../redux/slices/authSlice";

export default function NoPermissionsPage() {
  const { currentUser } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
            <Lock className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            No Permissions Assigned
          </h1>
          <p className="text-gray-600">
            Your account doesn't have access to any features
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Access Required
              </p>
              <p className="text-sm text-blue-700">
                Your account exists but no permissions or roles have been
                assigned to you yet.
              </p>
            </div>
          </div>
        </div>

        <div className="text-left space-y-3 mb-6">
          <p className="text-sm text-gray-700">
            <strong>What you can do:</strong>
          </p>
          <ul className="text-sm text-gray-600 space-y-2 ml-4">
            <li>• Contact your administrator to request access permissions</li>
            <li>• Ask for specific roles or feature access you need</li>
            <li>• Wait while your access is being configured</li>
          </ul>
        </div>

        <div className="border-t pt-6">
          <p className="text-sm text-gray-700 mb-4">
            Please reach out to get the necessary permissions:
          </p>
          <div className="space-y-2">
            <a
              href={`https://mail.google.com/mail/?view=cm&to=${
                import.meta.env.VITE_SMTP_USER
              }&su=Permission%20Access%20Request&body=Hello%20Admin,%0D%0A%0D%0AI%20need%20permissions%20assigned%20to%20my%20account%20to%20access%20the%20platform.%0D%0A%0D%0AUser:%20${
                currentUser?.email || "N/A"
              }%0D%0A%0D%0AThank you`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Request Permissions
            </a>
            <button
              onClick={handleLogout}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
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
