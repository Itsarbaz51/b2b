import { useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { rupeesToPaise } from "../../utils/lib";
import HeaderSection from "../ui/HeaderSection";
import InputField from "../ui/InputField";
import ButtonField from "../ui/ButtonField";
import { DropdownField } from "../ui/DropdownField";

import {
  createProviderSlab, // ✅ ADD THIS
} from "../../redux/slices/serviceSlice";

export default function AddProviderSlabForm({
  mappingId,
  editData,
  onClose,
  onSuccess,
}) {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    minAmount: "",
    maxAmount: "",
    providerCost: "",
    sellingPrice: 0,
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setForm({
        minAmount: editData.minAmount / 100,
        maxAmount: editData.maxAmount / 100,
        providerCost: editData.providerCost ? editData.providerCost / 100 : "",
        sellingPrice: editData.sellingPrice ? editData.sellingPrice / 100 : "",
      });
    }
  }, [editData]);

  const margin =
    Number(form.sellingPrice || 0) - Number(form.providerCost || 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!mappingId) return setError("Mapping not selected");

    if (Number(form.minAmount) >= Number(form.maxAmount)) {
      return setError("Min < Max required");
    }

    const payload = {
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
    };

    // ✅ UPDATE CASE
    if (editData?.id) payload.id = editData.id;

    try {
      await dispatch(createProviderSlab(payload));

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  // ✅ DELETE BUTTON
  const handleDelete = async () => {
    if (!editData?.id) return;

    if (!window.confirm("Delete slab?")) return;

    try {
      await dispatch(
        createProviderSlab({
          id: editData.id,
          _delete: true,
        }),
      );

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <HeaderSection
          title={editData ? "Update Slab" : "Create Slab"}
          isClose={onClose}
        />

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-100 text-red-600 p-2 rounded">{error}</div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <InputField
                label="Min ₹"
                type="number"
                value={form.minAmount}
                onChange={(e) =>
                  setForm({ ...form, minAmount: e.target.value })
                }
              />

              <InputField
                label="Max ₹"
                type="number"
                value={form.maxAmount}
                onChange={(e) =>
                  setForm({ ...form, maxAmount: e.target.value })
                }
              />

              <InputField
                label="Provider Cost ₹"
                type="number"
                value={form.providerCost}
                onChange={(e) =>
                  setForm({ ...form, providerCost: e.target.value })
                }
              />

              {form.mode === "COMMISSION" && (
                <InputField
                  label="Selling Price ₹"
                  type="number"
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: e.target.value })
                  }
                />
              )}
            </div>

            {/* margin */}
            {form.mode === "COMMISSION" && (
              <div className="font-semibold">Margin: ₹{margin}</div>
            )}

            <div className="flex justify-between">
              {editData && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Delete
                </button>
              )}

              <ButtonField
                name={editData ? "Update" : "Create"}
                type="submit"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
