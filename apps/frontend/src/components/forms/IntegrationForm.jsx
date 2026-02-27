import React from "react";
import {
  X,
  Check,
  Wifi,
  Loader2,
  Zap,
  Shield,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";

const SubServiceToggle = React.memo(({ subService, onToggle }) => {
  const handleToggle = (e) => {
    e.stopPropagation();
    onToggle(subService, e.target.checked);
  };

  const handleContainerClick = (e) => {
    if (e.target.type !== "checkbox") {
      const checkbox = e.currentTarget.querySelector('input[type="checkbox"]');
      if (checkbox) {
        checkbox.checked = !checkbox.checked;
        onToggle(subService, checkbox.checked);
      }
    }
  };

  return (
    <div
      className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg bg-white mb-3 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={handleContainerClick}
    >
      <input
        type="checkbox"
        id={`subservice-${subService?.id || subService?.code}`}
        checked={subService?.apiIntegrationStatus || false}
        onChange={handleToggle}
        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
      />
      <label
        htmlFor={`subservice-${subService?.id || subService?.code}`}
        className="flex-1 text-sm font-medium text-gray-700 cursor-pointer select-none"
      >
        {subService?.name || "Sub Service"}
      </label>
      <div
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          subService?.apiIntegrationStatus
            ? "bg-green-100 text-green-800"
            : "bg-gray-100 text-gray-600"
        }`}
      >
        {subService?.apiIntegrationStatus ? "Active" : "Inactive"}
      </div>
    </div>
  );
});

const SERVICE_FIELD_CONFIGS = {
  RAZORPAY: [
    {
      placeholder: "RAZORPAY_KEY_ID",
      keyHint: "rzp_test_...",
      autoFillKey: "RAZORPAY_KEY_ID", // ✅ Auto fill key name
    },
    {
      placeholder: "RAZORPAY_KEY_SECRET",
      keyHint: "Secret key",
      autoFillKey: "RAZORPAY_KEY_SECRET", // ✅ Auto fill key name
    },
  ],
  AEPS: [
    {
      placeholder: "Aadhaar API Key",
      keyHint: "Aadhaar Key",
      autoFillKey: "AEPS_API_KEY",
    },
    {
      placeholder: "Aadhaar Secret",
      keyHint: "Aadhaar Secret",
      autoFillKey: "AEPS_SECRET",
    },
    {
      placeholder: "Merchant ID",
      keyHint: "Merchant ID",
      autoFillKey: "AEPS_MERCHANT_ID",
    },
  ],
  BBPS: [
    {
      placeholder: "BBPS Username",
      keyHint: "Username",
      autoFillKey: "BBPS_USERNAME",
    },
    {
      placeholder: "BBPS Password",
      keyHint: "Password",
      autoFillKey: "BBPS_PASSWORD",
    },
    {
      placeholder: "Agent Key",
      keyHint: "Agent Key",
      autoFillKey: "BBPS_AGENT_KEY",
    },
  ],
  DMT: [
    {
      placeholder: "DMT API Key",
      keyHint: "API Key",
      autoFillKey: "DMT_API_KEY",
    },
    {
      placeholder: "DMT Secret",
      keyHint: "Secret Key",
      autoFillKey: "DMT_SECRET",
    },
    {
      placeholder: "Sender ID",
      keyHint: "Sender ID",
      autoFillKey: "DMT_SENDER_ID",
    },
  ],
  RECHARGE: [
    {
      placeholder: "Recharge API Key",
      keyHint: "API Key",
      autoFillKey: "RECHARGE_API_KEY",
    },
    {
      placeholder: "Recharge Secret",
      keyHint: "Secret",
      autoFillKey: "RECHARGE_SECRET",
    },
    {
      placeholder: "Operator ID",
      keyHint: "Operator ID",
      autoFillKey: "RECHARGE_OPERATOR_ID",
    },
  ],
  CC_PAYOUT: [
    {
      placeholder: "Payout API Key",
      keyHint: "API Key",
      autoFillKey: "CC_PAYOUT_API_KEY",
    },
    {
      placeholder: "Payout Secret",
      keyHint: "Secret Key",
      autoFillKey: "CC_PAYOUT_SECRET",
    },
    {
      placeholder: "Client ID",
      keyHint: "Client ID",
      autoFillKey: "CC_PAYOUT_CLIENT_ID",
    },
  ],
};

function EnvVariableInput({
  env,
  index,
  onUpdate,
  onToggleVisibility,
  serviceCode,
}) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (text) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getFieldConfig = () => {
    const config = SERVICE_FIELD_CONFIGS[serviceCode] || [];
    return (
      config[index] || {
        placeholder: "Enter value",
        keyHint: "Key",
        autoFillKey: `SERVICE_KEY_${index + 1}`,
      }
    );
  };

  const fieldConfig = getFieldConfig();

  React.useEffect(() => {
    if (fieldConfig.autoFillKey && (!env.key || env.key === "")) {
      onUpdate(index, "key", fieldConfig.autoFillKey);
    }
  }, [fieldConfig.autoFillKey, index, env.key, onUpdate]);

  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white mb-4">
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Key
          </label>
          <input
            type="text"
            value={env.key || ""}
            onChange={(e) => onUpdate(index, "key", e.target.value)}
            placeholder={fieldConfig.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Add: {fieldConfig.placeholder}
          </p>
        </div>
        <div className="col-span-7">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Value
          </label>
          <div className="relative">
            <input
              type={env.showValue ? "text" : "password"}
              value={env.value || ""}
              onChange={(e) => onUpdate(index, "value", e.target.value)}
              placeholder={fieldConfig.keyHint}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm pr-16"
            />
            <button
              type="button"
              onClick={() => onToggleVisibility(index)}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {env.showValue ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => handleCopy(env.value)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Suggested: {fieldConfig.keyHint}
          </p>
        </div>
      </div>
    </div>
  );
}

// SERVICE INFO COMPONENT
function ServiceInfo({ selectedApi, envInputs }) {
  const getServiceInstructions = () => {
    const instructions = {
      RAZORPAY:
        "Enter your Razorpay API credentials from the Razorpay dashboard.",
      AEPS: "Provide Aadhaar authentication credentials for AEPS services.",
      BBPS: "Enter BBPS provider credentials for bill payment services.",
      DMT: "Add money transfer service provider credentials.",
      RECHARGE: "Configure mobile recharge service API credentials.",
      CC_PAYOUT: "Set up credit card payout service credentials.",
    };

    return (
      instructions[selectedApi?.code] ||
      "Configure the service credentials below."
    );
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">
        {selectedApi?.name} Configuration
      </h3>
      <p className="text-sm text-gray-600 mb-3">{getServiceInstructions()}</p>
      <div className="flex items-center text-sm text-gray-500">
        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
          {envInputs.length} {envInputs.length === 1 ? "field" : "fields"}{" "}
          required
        </span>
        <span>
          Service Code: <strong>{selectedApi?.code}</strong>
        </span>
      </div>
    </div>
  );
}

// MAIN INTEGRATION FORM COMPONENT
export default function IntegrationForm({
  selectedApi,
  envInputs,
  testingConnection,
  onClose,
  onTestConnection,
  onSave,
  testConnectionSuccess,
  onUpdateEnv,
  onToggleVisibility,
  subServices,
  onSubServiceToggle,
}) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-lg rounded-2xl">
                {selectedApi?.iconUrl ? (
                  <img
                    src={selectedApi.iconUrl}
                    alt={selectedApi.name}
                    className="w-7 h-7"
                  />
                ) : (
                  <Zap className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {selectedApi?.name} Configuration
                </h2>
                <p className="text-white/80 text-sm mt-1">
                  {selectedApi?.description}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-xl"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/*  SERVICE INFORMATION */}
          <ServiceInfo selectedApi={selectedApi} envInputs={envInputs} />

          {/* SUB-SERVICES SECTION */}
          {subServices && subServices.length > 0 && (
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-800 mb-3">
                Sub-Services (
                {subServices.filter((s) => s.apiIntegrationStatus).length}{" "}
                active)
              </h4>
              <div className="space-y-2">
                {subServices.map((subService, index) => (
                  <SubServiceToggle
                    key={subService.id || subService.code || index}
                    subService={subService}
                    onToggle={onSubServiceToggle}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ENVIRONMENT VARIABLES SECTION */}
          {envInputs.length > 0 ? (
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-3">
                Credentials Configuration
              </h4>
              {envInputs.map((env, index) => (
                <EnvVariableInput
                  key={index}
                  env={env}
                  index={index}
                  onUpdate={onUpdateEnv}
                  onToggleVisibility={onToggleVisibility}
                  serviceCode={selectedApi?.code}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No environment variables required.
            </div>
          )}

          <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-blue-900 mb-1">
                  Security & Privacy
                </h4>
                <p className="text-sm text-blue-700">
                  Your credentials are encrypted with AES-256 and stored
                  securely.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex space-x-3">
          <button
            onClick={onTestConnection}
            disabled={testingConnection}
            className={`px-5 py-3 border-2 rounded-xl flex items-center ${
              testConnectionSuccess
                ? "border-green-500 bg-green-50 text-green-700"
                : testingConnection
                ? "border-gray-300 text-gray-700 opacity-50"
                : "border-gray-300 text-gray-700 hover:bg-white"
            }`}
          >
            {testingConnection ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : testConnectionSuccess ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Wifi className="w-4 h-4 mr-2" />
            )}
            {testingConnection
              ? "Testing..."
              : testConnectionSuccess
              ? "Connection Successful"
              : "Test Connection"}
          </button>

          <button
            onClick={onClose}
            className="px-5 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-white"
          >
            Cancel
          </button>

          <button
            onClick={onSave}
            disabled={!testConnectionSuccess}
            className={`flex-1 px-6 py-3 rounded-xl font-bold flex items-center justify-center ${
              testConnectionSuccess
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Check className="w-5 h-5 mr-2" />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
