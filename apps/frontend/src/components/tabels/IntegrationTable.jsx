import React from "react";
import { Plus, Settings, X, Check, Key, Zap } from "lucide-react";

function IntegrationTable({ integrations, onConnect, onDisconnect }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              API Service
            </th>
            <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Description
            </th>
            <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Status
            </th>
            <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Environment Variables
            </th>
            <th className="py-4 px-6 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200">
          {integrations.map((api) => (
            <tr
              key={api?.id}
              className="hover:bg-gray-50 transition-colors duration-150 group"
            >
              {/* Service Name */}
              <td className="py-4 px-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-xl">
                    {api?.iconUrl ? (
                      <img
                        src={api.iconUrl}
                        alt={api.name}
                        className="w-6 h-6 object-contain"
                      />
                    ) : (
                      <Zap className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {api?.name}
                    </h3>
                    {(api.subService || api.subServices) &&
                      (api.subService?.length > 0 ||
                        api.subServices?.length > 0) && (
                        <div className="text-xs text-gray-500 mt-1">
                          {api.subService?.length ||
                            api.subServices?.length ||
                            0}{" "}
                          sub-service(s)
                        </div>
                      )}
                  </div>
                </div>
              </td>

              {/* Description */}
              <td className="py-4 px-6 text-sm text-gray-600 max-w-xs">
                {api?.description || "No description provided"}
              </td>

              {/* Status */}
              <td className="py-4 px-6">
                {api?.apiIntegrationStatus ? (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-sm w-fit">
                    <Check className="w-4 h-4 text-white" />
                    <span className="text-xs font-bold text-white">
                      CONNECTED
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-200 rounded-full w-fit">
                    <span className="text-xs font-bold text-gray-600">
                      DISCONNECTED
                    </span>
                  </div>
                )}
              </td>

              {/* Env Variables */}
              <td className="py-4 px-6 text-xs text-gray-600">
                {api?.envConfig?.length > 0 ? (
                  <>
                    {api.envConfig.slice(0, 2).map((env, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <Key className="w-3 h-3 text-gray-400" />
                        <span className="font-mono">{env.key}</span>
                        <span className="text-gray-400">=</span>
                        <span className="font-mono text-gray-600">
                          {env.value ? "••••••••" : "Not set"}
                        </span>
                      </div>
                    ))}
                    {api.envConfig.length > 2 && (
                      <div className="text-gray-400 font-medium">
                        +{api.envConfig.length - 2} more
                      </div>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400">
                    {api.keyValueInputNumber || 0} variable(s) required
                  </span>
                )}
              </td>

              {/* Actions */}
              <td className="py-4 px-6">
                {api.apiIntegrationStatus ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onConnect(api)}
                      className="px-4 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold text-sm flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-2" /> Configure
                    </button>
                    <button
                      onClick={() => onDisconnect(api.id)}
                      className="px-4 py-2 border-2 border-red-200 rounded-lg text-red-600 hover:bg-red-50 font-semibold text-sm flex items-center"
                    >
                      <X className="w-4 h-4 mr-2" /> Disconnect
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => onConnect(api)}
                    className="px-6 py-2 bg-blue-700 text-white rounded-lg hover:shadow-lg font-semibold text-sm flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Connect
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default IntegrationTable;
