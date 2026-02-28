import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllServices, updateService } from "../redux/slices/serviceSlice";
import RefreshToast from "../components/ui/RefreshToast";

export default function ManageServices() {
  const dispatch = useDispatch();
  const { services, isLoading } = useSelector((state) => state.service);

  const [localLoading, setLocalLoading] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(getAllServices({ type: "provider" }));
  }, [dispatch]);

  const toggleService = async (item) => {
    try {
      setLocalLoading((prev) => ({ ...prev, [item.id]: true }));

      await dispatch(
        updateService(item.id, {
          type: item.providerId ? "service" : "provider",
          isActive: !item.isActive,
        }),
      );

      dispatch(getAllServices({ type: "provider" }));
    } catch (error) {
      console.error("Toggle error:", error);
    } finally {
      setLocalLoading((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await dispatch(getAllServices({ type: "provider" }));
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading && services.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Manage Services</h2>
        <RefreshToast
          isLoading={isLoading || refreshing}
          onClick={handleRefresh}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((item) => (
          <ServiceCard
            key={item.id}
            item={item}
            localLoading={localLoading}
            toggleService={toggleService}
          />
        ))}
      </div>
    </div>
  );
}
function ServiceCard({ item, localLoading, toggleService }) {
  const isActive = item?.isActive || false;
  const isLoading = localLoading[item.id];

  return (
    <div
      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${
        isActive
          ? "bg-white border-blue-200 shadow-lg"
          : "bg-gray-50 border-red-200"
      } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
      onClick={() => toggleService(item)}
    >
      <h3 className="text-xl font-semibold text-gray-900">{item.name}</h3>

      <div className="flex justify-between mt-4">
        <span
          className={`text-sm font-medium ${
            isActive ? "text-blue-600" : "text-red-500"
          }`}
        >
          {isActive ? "Active" : "Inactive"}
        </span>

        <div
          className={`relative inline-flex h-6 w-11 items-center rounded-full ${
            isActive ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
