import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { rupeesToPaise } from "../../utils/lib";

import HeaderSection from "../ui/HeaderSection";
import InputField from "../ui/InputField";
import ButtonField from "../ui/ButtonField";

import { createCommissionPaymentMethod } from "../../redux/slices/commissionSlice";
import { usePermissions } from "../../hooks/usePermission";
import { getBbpsCategories } from "../../redux/slices/bbpsSlice";
import { SERVICES } from "../../utils/constants";

const paymentMethods = [
  { label: "UPI", value: "UPI" },
  { label: "CARD", value: "CARD" },
  { label: "NETBANKING", value: "NETBANKING" },
];

const networks = [
  { label: "VISA", value: "VISA" },
  { label: "RUPAY", value: "RUPAY" },
  { label: "MASTERCARD", value: "MASTERCARD" },
];

export default function AddCommissionPaymentMethod({
  selectedCommissionForPayment,
  commissionSettingId,
  editData,
  onClose,
  onSuccess,
}) {
  const serviceCode =
    selectedCommissionForPayment?.serviceProviderMapping?.service?.code;

  const isFund = serviceCode === "FUND_REQUEST";
  const isBbps = serviceCode === "BBPS";

  const { canProcess, defaultProvider } = usePermissions(SERVICES.BBPS);
  const serviceProviderMappingId = defaultProvider?.serviceProviderMappingId;

  const { categories, isLoading } = useSelector((s) => s.bbps);

  const fetchRequests = () => {
    if (!serviceProviderMappingId || !canProcess) return;

    dispatch(getBbpsCategories({ serviceProviderMappingId }));
  };

  useEffect(() => {
    if (canProcess) fetchRequests();
  }, [serviceProviderMappingId, canProcess]);

  const dispatch = useDispatch();

  const [form, setForm] = useState({
    paymentMethod: "",
    network: "",
    category: "",
    type: "FLAT",
    value: "",
  });

  const [error, setError] = useState("");

  // 🔥 Prefill (edit case)
  useEffect(() => {
    if (editData) {
      setForm({
        paymentMethod: editData.paymentMethod || "",
        category: editData.category || "",
        network: editData.network || "",
        type: editData.type || "FLAT",
        value: Number(editData.value) / 100,
      });
    } else {
      setForm({
        paymentMethod: "",
        network: "",
        type: "FLAT",
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

    if (isBbps && !form.category) {
      return setError("Service required for BBPS");
    }

    if (isFund && !form.paymentMethod) {
      return setError("Payment method required");
    }

    if (form.paymentMethod === "CARD" && !form.network) {
      return setError("Network required for CARD");
    }
    const payload = {
      commissionSettingId,
      paymentMethod: form.paymentMethod,
      network: form.paymentMethod === "CARD" ? form.network : undefined,
      category: isBbps ? form.category : null,
      type: form.type,
      value: rupeesToPaise(Number(form.value)),
    };

    // update case
    if (editData?.id) {
      payload.id = editData.id;
    }

    try {
      await dispatch(createCommissionPaymentMethod(payload));

      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || "Failed to save payment method");
    }
  };

  const handleDelete = async () => {
    if (!editData?.id) return;

    try {
      await dispatch(
        createCommissionPaymentMethod({
          id: editData.id,
          _delete: true,
        }),
      );

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
          title={editData ? "Update Payment Method" : "Add Payment Method"}
          tagLine="Configure payment charges"
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
              {/* Payment Method */}
              {isFund && (
                <div>
                  <label className="text-sm font-semibold">
                    Payment Method
                  </label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        paymentMethod: e.target.value,
                        network: "",
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select</option>
                    {paymentMethods.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {isBbps && (
                <div>
                  <label className="text-sm font-semibold">Service</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Service</option>
                    {categories?.data?.flatMap((c) =>
                      c.services.map((s) => (
                        <option key={s.code} value={s.code}>
                          {s.name}
                        </option>
                      )),
                    )}
                  </select>
                </div>
              )}

              {/* Network (CARD only) */}
              {isFund && form.paymentMethod === "CARD" && (
                <div>
                  <label className="text-sm font-semibold">Network</label>
                  <select
                    value={form.network}
                    onChange={(e) =>
                      setForm({ ...form, network: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select Network</option>
                    {networks.map((n) => (
                      <option key={n.value} value={n.value}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Type */}
              <div>
                <label className="text-sm font-semibold">Type</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="FLAT">Flat</option>
                  <option value="PERCENTAGE">Percentage</option>
                </select>
              </div>

              {/* Value */}
              <InputField
                label={form.type === "FLAT" ? "Value (₹)" : "Value (%)"}
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
                  Delete
                </button>
              )}

              <ButtonField
                name={editData ? "Update Payment Method" : "Add Payment Method"}
                type="submit"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
