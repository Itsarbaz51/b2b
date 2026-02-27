import { AlertCircle, X, Map, Building2 } from "lucide-react";
import { useState } from "react";

export function AddStateModal({ isOpen, onClose, onAdd }) {
  const [stateName, setStateName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!stateName.trim()) {
      setError("State name is required");
      return;
    }
    onAdd(stateName);
    setStateName("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Map size={24} />
            Add New State
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              State Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={stateName}
              onChange={(e) => {
                setStateName(e.target.value);
                setError("");
              }}
              placeholder="e.g., Rajasthan, Maharashtra"
              className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                error ? "border-red-500" : "border-gray-200"
              } rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all`}
            />
            {error && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold hover:from-cyan-600 hover:to-purple-700 transition-all shadow-lg"
            >
              Add State
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AddCityModal({ isOpen, onClose, onAdd }) {
  const [cityName, setCityName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!cityName.trim()) {
      setError("City name is required");
      return;
    }
    onAdd({ cityName });
    setCityName("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-cyan-500 to-purple-600 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 size={24} />
            Add New City
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              City Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={cityName}
              onChange={(e) => {
                setCityName(e.target.value);
                setError("");
              }}
              placeholder="e.g., Jaipur, Mumbai"
              className={`w-full px-4 py-3 bg-gray-50 border-2 ${
                error ? "border-red-500" : "border-gray-200"
              } rounded-lg focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 transition-all`}
            />
            {error && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold hover:from-cyan-600 hover:to-purple-700 transition-all shadow-lg"
            >
              Add City
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
