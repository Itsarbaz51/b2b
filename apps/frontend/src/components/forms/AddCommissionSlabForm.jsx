import { useDispatch } from "react-redux";
import { useState, useEffect } from "react";
import { rupeesToPaise } from "../../utils/lib";

import HeaderSection from "../ui/HeaderSection";
import InputField from "../ui/InputField";
import ButtonField from "../ui/ButtonField";

import { createCommissionSlab } from "../../redux/slices/commissionSlice";

export default function AddCommissionSlabForm({
  commissionSettingId,
  editData,
  onClose,
  onSuccess,
}) {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    minAmount: "",
    maxAmount: "",
    value: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setForm({
        minAmount: Number(editData.minAmount) / 100,
        maxAmount: Number(editData.maxAmount) / 100,
        value: Number(editData.value) / 100,
      });
    } else {
      setForm({
        minAmount: "",
        maxAmount: "",
        value: "",
      });
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!commissionSettingId) {
      setError("Commission setting not selected");
      return;
    }

    if (Number(form.minAmount) >= Number(form.maxAmount)) {
      setError("Min amount must be less than max amount");
      return;
    }

    const payload = {
      commissionSettingId,
      minAmount: rupeesToPaise(Number(form.minAmount)),
      maxAmount: rupeesToPaise(Number(form.maxAmount)),
      value: rupeesToPaise(Number(form.value)),
    };

    // update case
    if (editData?.id) {
      payload.id = editData.id;
    }

    try {
      await dispatch(createCommissionSlab(payload));

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || "Failed to save slab");
    }
  };

  const handleDelete = async () => {
    if (!editData?.id) return;

    const payload = {
      id: editData.id,
      _delete: true,
    };

    try {
      await dispatch(createCommissionSlab(payload));

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <HeaderSection
          title={editData ? "Update Commission Slab" : "Create Commission Slab"}
          tagLine="Configure commission slab"
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
                label="Min Amount (₹)"
                type="number"
                step="0.01"
                value={form.minAmount}
                onChange={(e) =>
                  setForm({ ...form, minAmount: e.target.value })
                }
              />

              <InputField
                label="Max Amount (₹)"
                type="number"
                step="0.01"
                value={form.maxAmount}
                onChange={(e) =>
                  setForm({ ...form, maxAmount: e.target.value })
                }
              />

              <InputField
                label="Commission (₹)"
                type="number"
                step="0.01"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </div>

            <div className="flex justify-between">
              {editData && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  Delete Slab
                </button>
              )}

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
