import { useDispatch } from "react-redux";
import { createService, updateService } from "../../redux/slices/serviceSlice";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useRef } from "react";
import Editor from "@monaco-editor/react";
import { paisaToRupee, rupeesToPaise } from "../../utils/lib";
import HeaderSection from "../ui/HeaderSection";
import InputField from "../ui/InputField";
import ButtonField from "../ui/ButtonField";
import { DropdownField } from "../ui/DropdownField";

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
    mode: "",
    pricingValueType: "",
    commissionStartLevel: "NONE",
    supportsSlab: false,
    supportPaymentMethod: false,
    providerId: "",
    sellingPrice: 0,
    providerCost: 0,
    isActive: true,
    applyTDS: false,
    tdsPercent: "",
    applyGST: false,
    gstPercent: "",
  });

  const [config, setConfig] = useState("{}");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setForm({
        serviceId: editData.serviceId,
        providerId: editData.providerId,
        mode: editData.mode,
        pricingValueType: editData.pricingValueType,
        commissionStartLevel: editData.commissionStartLevel,
        supportsSlab: editData.supportsSlab || false,
        supportPaymentMethod: editData.supportPaymentMethod || false,
        sellingPrice: paisaToRupee(editData.sellingPrice),
        providerCost: paisaToRupee(editData.providerCost),
        isActive: editData.isActive ?? true,
        applyTDS: editData.applyTDS,
        tdsPercent: editData.tdsPercent,

        applyGST: editData.applyGST,
        gstPercent: editData.gstPercent,
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
      const rawConfig = editorRef.current?.getValue();

      parsedConfig = rawConfig ? JSON.parse(rawConfig) : {};
    } catch {
      setError("Invalid JSON in config");
      return;
    }

    const isDynamicPricing = form.supportsSlab || form.supportPaymentMethod;

    const payload = {
      type: "mapping",
      serviceId: form.serviceId,
      providerId: form.providerId,
      mode: form.mode,
      pricingValueType: form.pricingValueType,
      commissionStartLevel: form.commissionStartLevel,

      supportsSlab: form.supportsSlab,
      supportPaymentMethod: form.supportPaymentMethod,

      sellingPrice: isDynamicPricing
        ? 0
        : rupeesToPaise(Number(form.sellingPrice || 0)),

      providerCost: isDynamicPricing
        ? 0
        : rupeesToPaise(Number(form.providerCost || 0)),

      isActive: form.isActive,
      config: parsedConfig,

      applyTDS: form.applyTDS,
      tdsPercent: form.applyTDS ? form.tdsPercent : undefined,

      applyGST: form.applyGST,
      gstPercent: form.applyGST ? form.gstPercent : undefined,
    };

    if (editData) {
      await dispatch(updateService(editData.id, payload));
    } else {
      await dispatch(createService(payload));
    }

    onSuccess?.();
    onClose();
  };

  const statusOptions = [
    { id: true, label: "Active" },
    { id: false, label: "Inactive" },
  ];
  const serviceOptions = services.map((s) => ({
    id: s.id,
    label: s.name,
  }));

  const providerOptions = providers.map((p) => ({
    id: p.id,
    label: p.name,
  }));

  const modeOptions = [
    { id: "COMMISSION", label: "Commission" },
    { id: "SURCHARGE", label: "Surcharge" },
  ];

  const pricingTypeOptions = [
    { id: "FLAT", label: "Flat" },
    { id: "PERCENTAGE", label: "Percentage" },
  ];

  const commissionLevelOptions = [
    { id: "NONE", label: "None" },
    { id: "ADMIN_ONLY", label: "Admin" },
    { id: "HIERARCHY", label: "Hierarchy" },
  ];
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden">
        {/* Header */}
        <HeaderSection
          title={editData ? "Update Mapping" : "Create Mapping"}
          tagLine={"Configure service provider mapping"}
          isClose={onClose}
        />

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Fields */}
            <div className="grid md:grid-cols-2 gap-4">
              <DropdownField
                label="Service"
                value={form.serviceId}
                onChange={(e) =>
                  setForm({ ...form, serviceId: e.target.value })
                }
                options={serviceOptions.map((type) => ({
                  id: type.id,
                  label: type.label,
                }))}
              />
              <DropdownField
                label="Provider"
                value={form.providerId}
                onChange={(e) =>
                  setForm({ ...form, providerId: e.target.value })
                }
                options={providerOptions.map((type) => ({
                  id: type.id,
                  label: type.label,
                }))}
              />
              <DropdownField
                label="Mode"
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                options={modeOptions.map((type) => ({
                  id: type.id,
                  label: type.label,
                }))}
              />
              <DropdownField
                label="Pricing Type"
                value={form.pricingValueType}
                onChange={(e) =>
                  setForm({ ...form, pricingValueType: e.target.value })
                }
                options={pricingTypeOptions.map((type) => ({
                  id: type.id,
                  label: type.label,
                }))}
              />
              <DropdownField
                label="Commission Start Level"
                value={form.commissionStartLevel}
                onChange={(e) =>
                  setForm({ ...form, commissionStartLevel: e.target.value })
                }
                options={commissionLevelOptions.map((type) => ({
                  id: type.id,
                  label: type.label,
                }))}
              />

              {form.mode === "COMMISSION" &&
                !form.supportsSlab &&
                !form.supportPaymentMethod && (
                  <InputField
                    label={"Selling Price (₹)"}
                    type="number"
                    value={form.sellingPrice}
                    onChange={(e) =>
                      setForm({ ...form, sellingPrice: e.target.value })
                    }
                    min={0}
                  />
                )}
              <div>
                {!form.supportsSlab && !form.supportPaymentMethod && (
                  <InputField
                    label={"Provider Cost (₹)"}
                    type="number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                    value={form.providerCost}
                    onChange={(e) =>
                      setForm({ ...form, providerCost: e.target.value })
                    }
                    min={0}
                    step="0.01"
                  />
                )}

                <p className="text-xs text-gray-500 mt-1">
                  Stored: {(Number(providerCost) * 100).toFixed(0)} paisa
                </p>
              </div>

              <DropdownField
                label="Status Type"
                value={form.isActive}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isActive: e.target.value === "true",
                  })
                }
                options={statusOptions.map((type) => ({
                  id: type.id,
                  label: type.label,
                }))}
                placeholder="Select status type"
              />

              {form.mode === "COMMISSION" && (
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={form.applyTDS}
                    onChange={(e) =>
                      setForm({ ...form, applyTDS: e.target.checked })
                    }
                  />
                  <span>Apply TDS</span>

                  {form.applyTDS && (
                    <input
                      type="number"
                      placeholder="TDS %"
                      value={form.tdsPercent}
                      onChange={(e) =>
                        setForm({ ...form, tdsPercent: e.target.value })
                      }
                    />
                  )}
                </div>
              )}

              {form.mode === "SURCHARGE" && (
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={form.applyGST}
                    onChange={(e) =>
                      setForm({ ...form, applyGST: e.target.checked })
                    }
                  />
                  <span>Apply GST</span>

                  {form.applyGST && (
                    <input
                      type="number"
                      placeholder="GST %"
                      value={form.gstPercent}
                      onChange={(e) =>
                        setForm({ ...form, gstPercent: e.target.value })
                      }
                    />
                  )}
                </div>
              )}

              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  checked={form.supportsSlab}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      supportsSlab: e.target.checked,
                      sellingPrice: 0,
                      providerCost: 0,
                    })
                  }
                />

                <span className="ml-2 text-sm font-semibold">
                  Supports Slab
                </span>
              </div>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  checked={form.supportPaymentMethod}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      supportPaymentMethod: e.target.checked,
                      sellingPrice: 0,
                      providerCost: 0,
                    })
                  }
                />
                <span className="ml-2 text-sm font-semibold">
                  Supports Payment Method
                </span>
              </div>
            </div>

            {/* Margin */}
            {form.mode === "COMMISSION" &&
              !form.supportsSlab &&
              !form.supportPaymentMethod && (
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
              )}

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
                value={config}
                onChange={(value) => setConfig(value)}
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
              <ButtonField
                name={editData ? "Update Mapping" : "Create Mapping"}
                type="submit"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
