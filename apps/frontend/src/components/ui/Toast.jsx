import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const styles = {
  success: {
    icon: CheckCircle,
    color: "text-green-600",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-600",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-yellow-600",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
  },
};

const DialogToast = ({ type = "info", message, onClose }) => {
  const { icon: Icon, color } = styles[type] || styles.info;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      {/* Dialog */}
      <div className="relative bg-white w-[380px] rounded-2xl shadow-xl p-6 animate-[fadeIn_.2s_ease]">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        {/* Content */}
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className={`w-14 h-14 flex items-center justify-center rounded-full bg-gray-100 ${color}`}
          >
            <Icon size={32} />
          </div>

          <h3 className="text-lg font-semibold capitalize">{type}</h3>

          <p className="text-sm text-gray-600">{message}</p>

          <button
            onClick={onClose}
            className="mt-2 px-6 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default DialogToast;
