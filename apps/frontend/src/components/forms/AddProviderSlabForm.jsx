import { useDispatch } from "react-redux";
import { createService } from "../../redux/slices/serviceSlice";
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { rupeesToPaise } from "../../utils/lib";

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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-cyan-500 via-blue-600 to-indigo-700 px-6 py-5 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {editData ? "Update Slab" : "Create Slab"}
            </h2>

            <p className="text-blue-100 text-sm">
              Configure provider pricing slab
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              {/* Min Amount */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Min Amount (₹)
                </label>

                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  value={form.minAmount}
                  onChange={(e) =>
                    setForm({ ...form, minAmount: e.target.value })
                  }
                />
              </div>

              {/* Max Amount */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Max Amount (₹)
                </label>

                <input
                  type="number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  value={form.maxAmount}
                  onChange={(e) =>
                    setForm({ ...form, maxAmount: e.target.value })
                  }
                />
              </div>

              {/* Mode */}
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

              {/* Pricing Type */}
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Pricing Type
                </label>

                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl"
                  value={form.pricingValueType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pricingValueType: e.target.value,
                    })
                  }
                >
                  <option value="FLAT">Flat</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </div>

              {/* Provider Cost */}
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
                />
              </div>

              {/* Selling Price */}
              {form.mode === "COMMISSION" && (
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
                  />
                </div>
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
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold"
              >
                {editData ? "Update Slab" : "Create Slab"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
