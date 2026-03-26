import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Loader,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { verifyPasswordReset } from "../redux/slices/authSlice";

export default function VerifyResetPassword() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [verificationStatus, setVerificationStatus] = useState("checking");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setVerificationStatus("invalid");
      setMessage("Invalid or missing verification token");
      return;
    }

    setVerificationStatus("valid");
    setMessage("Click the button below to confirm and reset your password");
  }, [token]);

  // Success के बाद automatically redirect के लिए
  useEffect(() => {
    if (verificationStatus === "success") {
      const timer = setTimeout(() => {
        navigate("/login", {
          replace: true,
          state: {
            message:
              "Password reset successful! Check your email for temporary password.",
          },
        });
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [verificationStatus, navigate]);

  const handleConfirmReset = async () => {
    if (!token) return;

    try {
      setIsLoading(true);
      setVerificationStatus("processing");

      // Redux action को properly dispatch करें
      const resultAction = await dispatch(verifyPasswordReset(token));

      // Check if the action was fulfilled
      if (verifyPasswordReset.fulfilled.match(resultAction)) {
        setVerificationStatus("success");
        setMessage(
          resultAction.payload?.message ||
            "Password reset successfully! A temporary password has been sent to your email."
        );

        // यहाँ navigate नहीं करेंगे, useEffect automatic redirect कर देगा
      } else {
        throw new Error(resultAction.error?.message || "Password reset failed");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      setVerificationStatus("error");
      setMessage(error.message || "Password reset failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoToLogin = () => {
    navigate("/login", {
      replace: true,
      state: {
        message:
          verificationStatus === "success"
            ? "Password reset successful! Check your email for temporary password."
            : null,
      },
    });
  };

  const renderContent = () => {
    switch (verificationStatus) {
      case "checking":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Checking Reset Link
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your reset link...
            </p>
          </div>
        );

      case "valid":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <AlertTriangle className="w-12 h-12 text-orange-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Confirm Password Reset
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>

            <div className="bg-orange-50 border border-orange-200 rounded-md p-4 mb-6 text-left">
              <p className="text-sm text-orange-800 font-medium mb-2">
                <strong>Important:</strong>
              </p>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• This will reset your password immediately</li>
                <li>• A new temporary password will be sent to your email</li>
                <li>• You'll need to login with the temporary password</li>
                <li>• All your existing sessions will be logged out</li>
              </ul>
            </div>

            <div className="flex space-x-3 justify-center">
              <button
                onClick={handleConfirmReset}
                disabled={isLoading}
                className="bg-orange-600 text-white px-6 py-2 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <Loader className="w-4 h-4 animate-spin mr-2" />
                    Processing...
                  </span>
                ) : (
                  "Confirm & Reset Password"
                )}
              </button>
              <button
                onClick={handleGoToLogin}
                disabled={isLoading}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        );

      case "processing":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Resetting Password
            </h2>
            <p className="text-gray-600">
              Please wait while we reset your password...
            </p>
          </div>
        );

      case "success":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Password Reset Successful!
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6 text-left">
              <p className="text-sm text-green-800">
                <strong>What happens next:</strong>
              </p>
              <ul className="text-sm text-green-700 mt-2 space-y-1">
                <li>• Your password has been successfully reset</li>
                <li>• A new temporary password has been sent to your email</li>
                <li>• You'll be redirected to login page shortly</li>
                <li>• Use the temporary password to login</li>
                <li>• Set a new password after logging in</li>
              </ul>
            </div>
            <button
              onClick={handleGoToLogin}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              Go to Login Now
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Redirecting automatically in 5 seconds...
            </p>
          </div>
        );

      case "invalid":
      case "error":
        return (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {verificationStatus === "invalid"
                ? "Invalid Link"
                : "Reset Failed"}
            </h2>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6 text-left">
              <p className="text-sm text-red-800">
                <strong>Possible reasons:</strong>
              </p>
              <ul className="text-sm text-red-700 mt-2 space-y-1">
                <li>• The reset link has expired</li>
                <li>• The link has already been used</li>
                <li>• Invalid or malformed verification token</li>
                <li>• Technical error occurred</li>
              </ul>
            </div>
            <div className="flex space-x-3 justify-center">
              <button
                onClick={handleRetry}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleGoToLogin}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Shield className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="mt-4 text-center text-3xl font-bold tracking-tight text-gray-900">
          Password Reset
        </h1>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {renderContent()}
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            <strong>Security Notice:</strong> Always ensure you're using a
            secure connection and never share your verification links with
            anyone.
          </p>
        </div>
      </div>
    </div>
  );
}
