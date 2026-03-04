import { CheckCircle, Ban, Clock } from "lucide-react";

export const KYCStatusCard = ({ kycDetail }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case "VERIFIED":
        return {
          icon: CheckCircle,
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          title: "KYC VERIFIED",
          message: "Your KYC verification has been VERIFIED successfully.",
        };
      case "REJECT":
        return {
          icon: Ban,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          title: "KYC Rejected",
          message: `Your KYC was rejected. Reason: ${kycDetail.rejectReason}`,
        };
      case "PENDING":
        return {
          icon: Clock,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          title: "KYC Pending",
          message:
            "Your KYC verification is under review. Please wait for approval.",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-50",
          borderColor: "border-gray-200",
          title: "KYC Status Unknown",
          message: "Unable to determine KYC status.",
        };
    }
  };

  const config = getStatusConfig(kycDetail.status);
  const StatusIcon = config.icon;

  return (
    <div
      className={`border-2 ${config.borderColor} ${config.bgColor} rounded-2xl p-6 mb-6`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${config.bgColor}`}>
            <StatusIcon className={config.color} size={32} />
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${config.color} mb-2`}>
              {config.title}
            </h3>
            <p className="text-gray-700 mb-3">{config.message}</p>

            {kycDetail.status === "REJECT" && (
              <div className="mt-4">
                <ButtonField
                  name="Resubmit KYC"
                  type="button"
                  isOpen={() => window.location.reload()}
                  btncss="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
