import { useDispatch } from "react-redux";
import { createService, updateService } from "../../redux/slices/serviceSlice";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useRef } from "react";
import Editor from "@monaco-editor/react";
import { paisaToRupee, rupeesToPaise } from "../../utils/lib";

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
    mode: "COMMISSION",
    providerId: "",
    sellingPrice: 0,
    providerCost: 0,
    isActive: true,
  });

  const [config, setConfig] = useState("{}");
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setForm({
        serviceId: editData.serviceId,
        providerId: editData.providerId,
        mode: editData.mode,
        sellingPrice: paisaToRupee(editData.sellingPrice),
        providerCost: paisaToRupee(editData.providerCost),
        isActive: editData.isActive ?? true,
      });

      setConfig(JSON.stringify(editData.config || {}, null, 2));
    }
  }, [editData]);

  const providerCost = Number(form.providerCost);
  const sellingPrice = Number(form.sellingPrice);
  const margin = sellingPrice - providerCost;

  const editorRef = useRef(null);

  function handleEditorDidMount(editor) {
    editorRef.current = editor;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    let parsedConfig = {};

    try {
      const rawConfig = editorRef.current.getValue();

      parsedConfig = rawConfig ? JSON.parse(rawConfig) : {};
    } catch {
      setError("Invalid JSON in config");
      return;
    }

    const payload = {
      type: "mapping",
      serviceId: form.serviceId,
      providerId: form.providerId,
      mode: form.mode,
      sellingPrice: rupeesToPaise(form.sellingPrice),
      providerCost: rupeesToPaise(form.providerCost),
      isActive: form.isActive,
      config: parsedConfig,
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
                <label className="text-sm font-semibold mb-2 block">Mode</label>

                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  value={form.mode}
                  onChange={(e) => setForm({ ...form, mode: e.target.value })}
                >
                  <option value="COMMISSION">Commission</option>
                  <option value="SURCHARGE">Surcharge</option>
                </select>
              </div>

              {form.mode === "SURCHARGE" && (
                <div>
                  <label className="text-sm font-semibold mb-2 block">
                    Selling Price (₹)
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    value={form.sellingPrice}
                    onChange={(e) =>
                      setForm({ ...form, sellingPrice: e.target.value })
                    }
                    min={0}
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Provider Cost (₹)
                </label>

                <input
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  value={form.providerCost}
                  onChange={(e) =>
                    setForm({ ...form, providerCost: e.target.value })
                  }
                  min={0}
                />

                <p className="text-xs text-gray-500 mt-1">
                  Stored: {(Number(providerCost) * 100).toFixed(0)} paisa
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Status
                </label>

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
            </div>

            {/* Margin */}
            <div className="text-sm font-semibold">
              Margin:
              <span
                className={`ml-2 ${
                  margin >= 0 ? "text-green-600" : "text-red-500"
                }`}
              >
                ₹{margin}
              </span>
            </div>

            {/* CONFIG */}
            <div
              className="border border-gray-700 rounded-xl resize-y overflow-auto"
              style={{
                minHeight: "50px",
                height: "160px",
                maxHeight: "600px",
              }}
            >
              <Editor
                height="100%"
                width="100%"
                defaultLanguage="json"
                defaultValue={config}
                onMount={handleEditorDidMount}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  automaticLayout: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  scrollBeyondLastLine: false,
                  wordWrap: "on",
                  tabSize: 2,
                }}
              />
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
