import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllServices, updateService } from "../redux/slices/serviceSlice";
import RefreshToast from "../components/ui/RefreshToast";

export default function ManageServices() {
  const dispatch = useDispatch();
  const services = useSelector((state) => state?.service?.services?.data || []);
  const { isLoading } = useSelector((state) => state?.service);

  const [localLoading, setLocalLoading] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(getAllServices({ type: "provider" }));
  }, [dispatch]);

  const toggleItem = async (id, type, currentStatus) => {
    try {
      setLocalLoading((prev) => ({ ...prev, [id]: true }));

      await dispatch(
        updateService(id, {
          type, // "provider" | "service"
          isActive: !currentStatus,
        }),
      );

      dispatch(getAllServices({ type: "provider" }));
    } catch (error) {
      console.error("Toggle error:", error);
    } finally {
      setLocalLoading((prev) => ({ ...prev, [id]: false }));
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
        {services?.map((item) => (
          <ServiceCard
            key={item.id}
            item={item}
            localLoading={localLoading}
            toggleItem={toggleItem}
          />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({ item, localLoading, toggleItem }) {
  const isProviderLoading = localLoading[item.id];

  return (
    <div className="p-6 rounded-2xl border-2 bg-white shadow-lg">
      {/* Provider Toggle */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">{item.name}</h3>

        <ToggleSwitch
          isActive={item.isActive}
          isLoading={isProviderLoading}
          onClick={() => toggleItem(item.id, "provider", item.isActive)}
        />
      </div>

      {/* Services Under Provider */}
      <div className="mt-4 space-y-3">
        {item.mappings?.map((mapping) => {
          const service = mapping.service;

          return (
            <div
              key={mapping.id}
              className="flex justify-between items-center bg-gray-50 p-3 rounded-lg"
            >
              <span className="text-sm font-medium">{service?.name}</span>

              <ToggleSwitch
                isActive={service?.isActive}
                isLoading={localLoading[service?.id]}
                onClick={() =>
                  toggleItem(service.id, "service", service.isActive)
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ToggleSwitch({ isActive, isLoading, onClick }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!isLoading) onClick?.();
      }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer ${
        isActive ? "bg-blue-600" : "bg-gray-300"
      } ${isLoading ? "opacity-50" : ""}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
          isActive ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </div>
  );
}
