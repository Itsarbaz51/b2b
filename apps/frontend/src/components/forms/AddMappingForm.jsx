import { useDispatch } from "react-redux";
import { createService, updateService } from "../../redux/slices/serviceSlice";
import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";

export default function AddMappingForm({
  services = [],
  providers = [],
  editData,
  onClose,
  onSuccess,
}) {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    serviceId: "",
    providerId: "",
    sellingPrice: "",
    providerCost: "",
    isActive: true,
  });

  const [config, setConfig] = useState({});
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setForm({
        serviceId: editData.serviceId,
        providerId: editData.providerId,
        sellingPrice: editData.sellingPrice,
        providerCost: editData.providerCost,
        isActive: editData.isActive ?? true,
      });

      setConfig(editData.config || {});
    }
  }, [editData]);

  const providerCost = Number(form.providerCost || 0);
  const sellingPrice = Number(form.sellingPrice || 0);
  const margin = sellingPrice - providerCost;

  const formatMoney = (value) => {
    return (Number(value) / 100).toFixed(2);
  };

  const handleConfigChange = (key, value) => {
    setConfig({
      ...config,
      [key]: value,
    });
  };

  const addConfigField = () => {
    if (!newKey) return;

    setConfig({
      ...config,
      [newKey]: newValue,
    });

    setNewKey("");
    setNewValue("");
  };

  const removeConfigField = (key) => {
    const updated = { ...config };
    delete updated[key];
    setConfig(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (sellingPrice < providerCost) {
      setError("Selling price cannot be less than provider cost");
      return;
    }

    const payload = {
      type: "mapping",
      ...form,
      config,
    };

    if (editData) {
      await dispatch(updateService(editData.id, payload));
    } else {
      await dispatch(createService(payload));
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-cyan-500 via-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {editData ? "Update Mapping" : "Create Mapping"}
            </h2>
            <p className="text-blue-100 text-sm">
              Configure service provider mapping
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Service
                </label>

                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  value={form.serviceId}
                  onChange={(e) =>
                    setForm({ ...form, serviceId: e.target.value })
                  }
                >
                  <option>Select Service</option>

                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Provider
                </label>

                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  value={form.providerId}
                  onChange={(e) =>
                    setForm({ ...form, providerId: e.target.value })
                  }
                >
                  <option>Select Provider</option>

                  {providers.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Selling Price (paisa)
                </label>

                <input
                  type="number"
                  className="w-full px-4 py-3 border  border-gray-300 rounded-xl"
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: e.target.value })
                  }
                />

                <p className="text-xs text-gray-500 mt-1">
                  Display: ₹{formatMoney(sellingPrice)}
                </p>
              </div>

              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Provider Cost (paisa)
                </label>

                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  value={form.providerCost}
                  onChange={(e) =>
                    setForm({ ...form, providerCost: e.target.value })
                  }
                />

                <p className="text-xs text-gray-500 mt-1">
                  Display: ₹{formatMoney(providerCost)}
                </p>
              </div>
            </div>

            {/* Margin */}
            <div className="text-sm font-semibold">
              Margin:
              <span
                className={`ml-2 ${
                  margin >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                ₹{formatMoney(margin)}
              </span>
            </div>

            <div>
              <label className="text-sm font-semibold mb-2 block">Status</label>

              <select
                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                value={form.isActive}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isActive: e.target.value === "true",
                  })
                }
              >
                <option value={true}>Active</option>
                <option value={false}>Inactive</option>
              </select>
            </div>

            {/* CONFIG */}
            <div className="border border-gray-300 rounded-xl p-4 bg-gray-50">
              <h3 className="font-semibold mb-4">API Configuration</h3>

              {Object.entries(config).map(([key, value]) => (
                <div
                  key={key}
                  className="grid grid-cols-12 gap-3 mb-3 items-center"
                >
                  <div className="col-span-4 text-sm font-medium">{key}</div>

                  <div className="col-span-7">
                    <input
                      className="w-full border border-gray-300 px-3 py-2 rounded-lg"
                      value={value}
                      onChange={(e) => handleConfigChange(key, e.target.value)}
                    />
                  </div>

                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeConfigField(key)}
                      className="text-red-500"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}

              {/* Add config */}
              <div className="grid grid-cols-12 gap-3 mt-4">
                <input
                  placeholder="Config Key"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="col-span-4 border border-gray-300 px-3 py-2 rounded-lg"
                />

                <input
                  placeholder="Config Value"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  className="col-span-7 border  border-gray-300 px-3 py-2 rounded-lg"
                />

                <button
                  type="button"
                  onClick={addConfigField}
                  className="col-span-1 bg-green-500 text-white rounded-lg flex justify-center items-center"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
              >
                {editData ? "Update Mapping" : "Create Mapping"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
