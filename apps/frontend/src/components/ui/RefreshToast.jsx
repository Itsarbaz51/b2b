import { RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const RefreshToast = ({ isLoading, onClick }) => {
  const handleRefresh = async () => {
    const id = toast.loading("Refreshing data...", {
      style: {
        background: "#155dfc",
        color: "#fff",
      },
    });

    try {
      // Call the passed-in function
      await onClick();

      // Show success toast
      setTimeout(() => {
        toast.update(id, {
          render: "Data refreshed successfully!",
          type: "success",
          isLoading: false,
          autoClose: 1000,
          style: {
            background: "#fff",
            color: "#111",
          },
        });
      }, 1000);
    } catch (error) {
      // Show error toast
      toast.update(id, {
        render: "Failed to refresh data.",
        type: "error",
        isLoading: false,
        autoClose: 2000,
        style: {
          background: "#ff4d4f",
          color: "#fff",
        },
      });
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isLoading}
      className="inline-flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium shadow-sm"
      style={{
        cursor: isLoading ? "not-allowed" : "pointer",
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
      {isLoading ? "Refreshing..." : "Refresh"}
    </button>
  );
};

export default RefreshToast;
