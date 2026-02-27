import { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  allServices,
  ApiTesting,
  envConfig,
  toggleStatusApiIntigration,
} from "../redux/slices/serviceSlice";
import { CheckCircle2, Cpu, Shield, Zap } from "lucide-react";
import IntegrationTable from "../components/tabels/IntegrationTable";
import IntegrationForm from "../components/forms/IntegrationForm";
import RefreshToast from "../components/ui/RefreshToast";

function ApiIntegration() {
  const [integrations, setIntegrations] = useState([]);
  const [selectedApi, setSelectedApi] = useState(null);
  const [envInputs, setEnvInputs] = useState([]);
  const [subServices, setSubServices] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [testConnectionSuccess, setTestConnectionSuccess] = useState(false);

  const dispatch = useDispatch();
  const { serviceProviders, isLoading } = useSelector(
    (state) => state.services
  );

  const fetchHandle = useCallback(() => {
    dispatch(allServices("all"));
  }, [dispatch]);

  useEffect(() => {
    fetchHandle();
  }, [fetchHandle]);

  useEffect(() => {
    if (Array.isArray(serviceProviders?.allApiIntigration)) {
      const sanitized = serviceProviders?.allApiIntigration.map((sp) => {
        let envConfigData = sp.envConfig || [];
        if (typeof sp.envConfig === "string") {
          try {
            envConfigData = JSON.parse(sp.envConfig);
          } catch {
            envConfigData = [];
          }
        }
        return {
          ...sp,
          envConfig: envConfigData,
          connected: sp.apiIntegrationStatus || false,
          envVars: envConfigData.map((env) => ({
            key: env.key || "",
            value: env.value || "",
            showValue: false,
          })),
        };
      });
      setIntegrations(sanitized);
    }
  }, [serviceProviders?.allApiIntigration]);

  const handleConnect = useCallback((api) => {
    setSelectedApi(api);
    const expectedCount = Number(api?.keyValueInputNumber) || 0;
    let initialEnvVars = [];

    if (Array.isArray(api.envConfig) && api.envConfig.length > 0) {
      initialEnvVars = api.envConfig.map((env) => ({
        key: env.key || "",
        value: env.value || "",
      }));
    } else if (expectedCount > 0) {
      initialEnvVars = Array.from({ length: expectedCount }, () => ({
        key: "",
        value: "",
      }));
    }

    setEnvInputs(initialEnvVars);

    const apiSubServices = api.subService || [];
    if (Array.isArray(apiSubServices) && apiSubServices.length > 0) {
      setSubServices(
        apiSubServices.map((sub) => ({
          id: sub.id,
          code: sub.code,
          name: sub.name,
          apiIntegrationStatus: sub.apiIntegrationStatus || false,
        }))
      );
    } else {
      setSubServices([]);
    }

    setShowPopup(true);
  }, []);

  const handleDisconnectBtn = useCallback(
    async (apiId) => {
      try {
        await dispatch(toggleStatusApiIntigration(apiId));
      } catch (error) {
        console.error("Failed to disconnect:", error);
      }
    },
    [dispatch]
  );

  const updateEnvVariable = (index, field, value) => {
    setEnvInputs((prev) =>
      prev.map((env, i) => (i === index ? { ...env, [field]: value } : env))
    );
  };

  const toggleShowValue = (index) => {
    setEnvInputs((prev) =>
      prev.map((env, i) =>
        i === index ? { ...env, showValue: !env.showValue } : env
      )
    );
  };

  const handleSubServiceToggle = useCallback((subService, isChecked) => {
    setSubServices((prev) =>
      prev.map((sub) => {
        if (sub.id === subService.id) {
          return { ...sub, apiIntegrationStatus: isChecked };
        }
        return sub;
      })
    );
  }, []);

  // --- Test Connection ---
  const handleTestConnection = async () => {
    if (!selectedApi) return;

    setTestingConnection(true);
    setTestConnectionSuccess(false);
    try {
      const validEnvs = envInputs.filter(
        (env) => env.key.trim() && env.value.trim()
      );
      const payload = { envConfig: validEnvs };

      await dispatch(ApiTesting(selectedApi.id, payload));
      setTestConnectionSuccess(true);
      setShowSuccessToast(true);

      setTimeout(() => setShowSuccessToast(false), 3000);
    } catch (error) {
      setTestConnectionSuccess(false);
      throw console.error("Failed call api testing connection", error);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async () => {
    try {
      const validEnvs = envInputs.filter(
        (env) => env.key.trim() && env.value.trim()
      );

      const payload = {
        envConfig: validEnvs,
        subServices: subServices.map((sub) => ({
          id: sub.id,
          apiIntegrationStatus: sub.apiIntegrationStatus || false,
        })),
      };

      await dispatch(envConfig({ id: selectedApi.id, payload }));
      setTestConnectionSuccess(false);
      setShowPopup(false);
    } catch (err) {
      console.error("❌ Save failed:", err);
    }
  };

  const activeCount = integrations.filter(
    (integration) => integration.connected
  ).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Cpu className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
                API Integrations
              </h1>
            </div>
            <p className="text-gray-600 text-lg max-w-2xl">
              Connect and manage your service provider APIs securely with
              encrypted configurations.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Status Card */}
            <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-semibold text-gray-700">
                  {activeCount} Active
                </span>
              </div>
              <div className="w-px h-6 bg-gray-300" />
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-600">
                  {integrations.length} Total
                </span>
              </div>
            </div>

            <RefreshToast isLoading={isLoading} onClick={fetchHandle} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">
                  Connected APIs
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {activeCount}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Cpu className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Total Services
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {integrations.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-700">Secure</p>
                <p className="text-2xl font-bold text-emerald-900">100%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Integration Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">
            Service Providers
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage API connections and configurations for all service providers
          </p>
        </div>
        <IntegrationTable
          integrations={integrations}
          onConnect={handleConnect}
          onDisconnect={handleDisconnectBtn}
        />
      </div>

      {/* Popup Form */}
      {showPopup && selectedApi && (
        <IntegrationForm
          selectedApi={selectedApi}
          envInputs={envInputs}
          subServices={subServices}
          testingConnection={testingConnection}
          onTestConnection={handleTestConnection}
          testConnectionSuccess={testConnectionSuccess}
          onClose={() => {
            setShowPopup(false);
            setTestConnectionSuccess(false);
          }}
          onSave={handleSave}
          onUpdateEnv={updateEnvVariable}
          onToggleVisibility={toggleShowValue}
          onSubServiceToggle={handleSubServiceToggle}
        />
      )}

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-[60] animate-in slide-in-from-right duration-500">
          <div className="bg-white rounded-xl shadow-2xl border border-emerald-200 p-4 flex items-center space-x-3 min-w-[280px]">
            <div className="flex-shrink-0">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900 text-sm">
                Connection Successful!
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                API configuration tested successfully
              </p>
            </div>
            <button
              onClick={() => setShowSuccessToast(false)}
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiIntegration;
