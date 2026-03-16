import { useDispatch } from "react-redux";
import { createService } from "../../redux/slices/serviceSlice";
import { useState, useEffect } from "react";
import { rupeesToPaise } from "../../utils/lib";
import HeaderSection from "../ui/HeaderSection";
import InputField from "../ui/InputField";
import ButtonField from "../ui/ButtonField";
import { DropdownField } from "../ui/DropdownField";

export default function AddProviderSlabForm({
  mappingId,
  editData,
  onClose,
  onSuccess,
}) {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    minAmount: 0,
    maxAmount: 0,
    providerCost: 0,
    sellingPrice: 0,
    mode: "COMMISSION",
    pricingValueType: "FLAT",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setForm({
        minAmount: editData.minAmount / 100,
        maxAmount: editData.maxAmount / 100,
        providerCost: editData.providerCost ? editData.providerCost / 100 : "",
        sellingPrice: editData.sellingPrice ? editData.sellingPrice / 100 : "",
        mode: editData.mode,
        pricingValueType: editData.pricingValueType,
      });
    }
  }, [editData]);

  const margin =
    Number(form.sellingPrice || 0) - Number(form.providerCost || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!mappingId) {
      setError("Mapping not selected");
      return;
    }

    if (Number(form.minAmount) >= Number(form.maxAmount)) {
      setError("Min amount must be less than max amount");
      return;
    }

    const payload = {
      type: "slab",

      serviceProviderMappingId: mappingId,

      minAmount: rupeesToPaise(Number(form.minAmount)),
      maxAmount: rupeesToPaise(Number(form.maxAmount)),

      providerCost: form.providerCost
        ? rupeesToPaise(Number(form.providerCost))
        : undefined,

      sellingPrice:
        form.mode === "COMMISSION"
          ? rupeesToPaise(Number(form.sellingPrice))
          : undefined,

      mode: form.mode,
      pricingValueType: form.pricingValueType,
    };

    await dispatch(createService(payload));

    onSuccess?.();
    onClose();
  };
  const modeOptions = [
    { id: "COMMISSION", label: "Commission" },
    { id: "SURCHARGE", label: "Surcharge" },
  ];

  const pricingTypeOptions = [
    { id: "FLAT", label: "Flat" },
    { id: "PERCENTAGE", label: "Percentage" },
  ];

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <HeaderSection
          title={editData ? "Update Slab" : "Create Slab"}
          tagLine={"Configure provider pricing slab"}
          isClose={onClose}
        />

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label={"Min Amount (₹)"}
                type="number"
                value={form.minAmount}
                onChange={(e) =>
                  setForm({ ...form, minAmount: e.target.value })
                }
              />

              {/* Max Amount */}
              <InputField
                label={"Max Amount (₹)"}
                type="number"
                value={form.maxAmount}
                onChange={(e) =>
                  setForm({ ...form, maxAmount: e.target.value })
                }
              />

              {/* Mode */}
              <DropdownField
                label="Status"
                value={form.mode}
                onChange={(e) => setForm({ ...form, mode: e.target.value })}
                options={modeOptions.map((type) => ({
                  id: type.id,
                  label: type.label,
                }))}
              />

              {/* Pricing Type */}
              <DropdownField
                label="Pricing Type"
                value={form.pricingValueType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    pricingValueType: e.target.value,
                  })
                }
                options={pricingTypeOptions.map((type) => ({
                  id: type.id,
                  label: type.label,
                }))}
              />

              {/* Provider Cost */}
              <InputField
                label={"Provider Cost (₹)"}
                type="number"
                value={form.providerCost}
                onChange={(e) =>
                  setForm({ ...form, providerCost: e.target.value })
                }
              />

              {/* Selling Price */}
              {form.mode === "COMMISSION" && (
                <InputField
                  label={"Selling Price (₹)"}
                  type="number"
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: e.target.value })
                  }
                />
              )}
            </div>

            {/* Margin */}
            {form.mode === "COMMISSION" && (
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

            <div className="flex justify-end">
              <ButtonField
                name={editData ? "Update Slab" : "Create Slab"}
                type="submit"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
