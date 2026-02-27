import { useState } from "react";

function ConfirmCard({
  actionType,
  isClose,
  isSubmit,
  user,
  predefinedReasons,
}) {
  const isDeactivate = actionType === "Deactivate";
  const isActivate = actionType === "Activate";
  const isDelete = actionType === "Delete";
  const isReject = actionType === "REJECT";

  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    // For activation, always use default message
    const finalReason = isActivate
      ? "Activated by admin"
      : isReject
      ? reason.trim() || ""
      : reason.trim() || `${actionType}d by admin`;

    setIsSubmitting(true);
    setError("");

    try {
      await isSubmit(finalReason);
    } catch (err) {
      setError(err.message || `Failed to ${actionType.toLowerCase()} user`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 shadow-lg max-w-md w-full mx-4">
        <h2 className="text-lg font-bold mb-4">{actionType} User</h2>

        {user && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">
              {user?.firstName || user?.profile?.name || user?.accountHolder}{" "}
              {user?.lastName}
            </p>
            <p className="text-sm text-gray-600">
              {user?.email || user?.profile?.email || user?.accountNumber}
            </p>
            <p className="text-sm text-gray-600">{user?.role?.name}</p>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Hide reason section for activation */}
        {!isActivate && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for {actionType.toLowerCase()}
            </label>

            <div className="grid grid-cols-1 gap-2 mb-3">
              {predefinedReasons?.map((predefinedReason) => (
                <button
                  key={predefinedReason}
                  type="button"
                  onClick={() => setReason(predefinedReason)}
                  className={`text-left p-2 text-sm rounded border transition-colors ${
                    reason === predefinedReason
                      ? "bg-blue-50 border-blue-300 text-blue-700"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {predefinedReason}
                </button>
              ))}
            </div>

            {actionType !== "VERIFIED" && (
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows="3"
              />
            )}

            <p className="text-xs text-gray-500 mt-1">
              Providing a reason helps maintain audit records
            </p>
          </div>
        )}

        <p className="mb-4 text-gray-700 text-sm">
          You are about to{" "}
          <span
            className={`font-semibold ${
              isDeactivate
                ? "text-red-600"
                : isActivate
                ? "text-green-600"
                : "text-red-700"
            }`}
          >
            {actionType.toLowerCase()}
          </span>{" "}
          this user.
          {isDeactivate && " They will lose access to the system."}
          {isActivate && " They will regain access to the system."}
          {isDelete && " This action is permanent and cannot be undone."}
        </p>

        <div className="flex justify-end space-x-3">
          <button
            onClick={isClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              isDeactivate || isDelete  || isReject
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isSubmitting ? "Processing..." : `Confirm ${actionType}`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmCard;
