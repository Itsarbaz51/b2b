import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { allServices, toggleStatusService } from "../redux/slices/serviceSlice";
import RefreshToast from "../components/ui/RefreshToast";

export default function ManageServices() {
  const dispatch = useDispatch();
  const { serviceProviders, isLoading } = useSelector(
    (state) => state.services
  );

  // Ultra-safe array handling
  const getSafeServiceProviders = () => {
    try {
      if (Array.isArray(serviceProviders)) {
        return serviceProviders;
      }
      if (serviceProviders && Array.isArray(serviceProviders.data)) {
        return serviceProviders.data;
      }
      return [];
    } catch (error) {
      console.error("Error parsing serviceProviders:", error);
      return [];
    }
  };

  const allServiceProviders = getSafeServiceProviders();
  const [localLoading, setLocalLoading] = useState({});
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(allServices("allServices"));
  }, [dispatch]);

  const toggleService = async (serviceId) => {
    try {
      setLocalLoading((prev) => ({ ...prev, [serviceId]: true }));
      await dispatch(toggleStatusService(serviceId));

      // Small delay before refresh
      setTimeout(() => {
        dispatch(allServices("allServices"));
      }, 500);
    } catch (error) {
      console.error("Error toggling service:", error);
      dispatch(allServices("allServices"));
    } finally {
      setLocalLoading((prev) => ({ ...prev, [serviceId]: false }));
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await dispatch(allServices("allServices"));
    } catch (error) {
      console.error("Error refreshing services:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Loading state
  if (isLoading && allServiceProviders.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Main render
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
        {allServiceProviders.map((serviceProvider) => (
          <ServiceCard
            key={serviceProvider.id}
            serviceProvider={serviceProvider}
            localLoading={localLoading}
            toggleService={toggleService}
          />
        ))}
      </div>
    </div>
  );
}

// Separate component for better error handling
function ServiceCard({ serviceProvider, localLoading, toggleService }) {
  const isActive = serviceProvider?.isActive || false;
  const isServiceLoading = localLoading[serviceProvider.id];
  const hasSubServices =
    serviceProvider?.subService &&
    Array.isArray(serviceProvider.subService) &&
    serviceProvider.subService.length > 0;
  const isParent = serviceProvider?.parentId === null;

  return (
    <div
      className={`relative p-6 rounded-2xl border-2 transition-all duration-300 h-fit ${
        isActive
          ? "bg-white border-blue-200 shadow-lg shadow-blue-100"
          : "bg-gray-50 border-red-200 shadow-sm"
      } ${isServiceLoading ? "opacity-50" : ""}`}
    >
      {/* Rest of your card JSX remains the same */}
      <div
        className={`cursor-pointer group ${
          isServiceLoading ? "pointer-events-none" : ""
        }`}
        onClick={() => toggleService(serviceProvider.id, isActive, isParent)}
      >
        <div className="mb-4">
          {isParent && (
            <p className="text-blue-600 text-xs mt-1 font-medium">
              Parent Service
            </p>
          )}
          <h3 className="text-xl font-semibold text-gray-900">
            {serviceProvider.name}
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <span
            className={`text-sm font-medium ${
              isActive ? "text-blue-600" : "text-red-500"
            }`}
          >
            {isActive ? "Active" : "Inactive"}
          </span>

          <div className="relative">
            <div
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                isActive ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </div>
            {isServiceLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              </div>
            )}
          </div>
        </div>

        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/5 group-hover:to-purple-400/5 transition-all duration-300" />
      </div>

      {/* Sub-services section */}
      {hasSubServices && (
        <>
          <div className="my-4 border-t border-gray-200" />
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Sub Services:</h4>
            {serviceProvider.subService.map((subService, index) => (
              <SubServiceItem
                key={subService.id}
                subService={subService}
                index={index}
                localLoading={localLoading}
                toggleService={toggleService}
              />
            ))}
          </div>
        </>
      )}

      {hasSubServices && isParent && (
        <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Toggling this parent service will{" "}
            {isActive ? "deactivate" : "activate"} all sub-services
          </p>
        </div>
      )}
    </div>
  );
}

function SubServiceItem({ subService, index, localLoading, toggleService }) {
  const isSubActive = subService?.isActive || false;
  const isSubLoading = localLoading[subService.id];

  return (
    <div
      className={`flex justify-between items-center p-3 rounded-lg border transition-all duration-200 ${
        isSubActive
          ? "bg-blue-50 border-blue-200"
          : "bg-gray-100 border-gray-200"
      } ${isSubLoading ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleService(subService.id, isSubActive, false);
      }}
    >
      <div className="flex items-center space-x-2">
        <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">
          {index + 1}
        </span>
        <div>
          <span className="text-sm font-medium text-gray-900">
            {subService.name}
          </span>
          <p className="text-xs text-gray-500">{subService.type}</p>
        </div>
      </div>

      <div className="relative">
        <div
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 ${
            isSubActive ? "bg-blue-500" : "bg-gray-400"
          }`}
        >
          <span
            className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 ${
              isSubActive ? "translate-x-5" : "translate-x-1"
            }`}
          />
        </div>
        {isSubLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
          </div>
        )}
      </div>
    </div>
  );
}
