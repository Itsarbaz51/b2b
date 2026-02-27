import { Mail, X, Key, Lock } from "lucide-react";
import { useState, useEffect } from "react";

export default function ForgotCredentialsModal({
  setForgotMode,
  handleForgotCredentials,
  forgotForm,
  setForgotForm,
  loading,
  userData,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState(null);
  const [buttonText, setButtonText] = useState("");

  useEffect(() => {
    setTitle("Forgot Password & PIN");
    setDescription(
      "We'll send reset links for both password and PIN to this email address. The links will expire in 2 minutes."
    );
    setIcon(<Lock className="w-5 h-5 mr-2 text-blue-600" />);
    setButtonText("Send Reset Links");
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    handleForgotCredentials(forgotForm.email);
  };

  const handleCancel = () => {
    setForgotMode(false);
    setForgotForm({
      email: userData?.email || "",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            {icon}
            {title}
          </h3>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 p-3 rounded-md bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-800 font-medium">
            🔒 Secure Credentials Reset
          </p>
          <p className="text-xs text-gray-600 mt-1">
            Reset both your password and transaction PIN for complete account
            access.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={forgotForm.email}
              onChange={(e) =>
                setForgotForm({
                  ...forgotForm,
                  email: e.target.value,
                })
              }
              disabled={Boolean(userData)}
              className={`${
                userData ? "cursor-not-allowed bg-gray-100" : ""
              } mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
              placeholder="Enter your email address"
              required
            />
            <p className="text-sm text-gray-500 mt-2">{description}</p>
          </div>

          <div className="bg-gray-50 rounded-md p-3">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> After reset, you will need to create a new
              strong password and set a new 4-digit transaction PIN.
            </p>
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50 transition-colors font-medium hover:bg-blue-700"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </span>
              ) : (
                buttonText
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Never share your credentials with anyone. Our team will never ask
            for your password or PIN.
          </p>
        </div>
      </div>
    </div>
  );
}
