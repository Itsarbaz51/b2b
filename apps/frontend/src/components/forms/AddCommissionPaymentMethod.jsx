import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { rupeesToPaise } from "../../utils/lib";

import HeaderSection from "../ui/HeaderSection";
import InputField from "../ui/InputField";
import ButtonField from "../ui/ButtonField";

import { createCommissionPaymentMethod } from "../../redux/slices/commissionSlice";
import { usePermissions } from "../../hooks/usePermission";
import { getBbpsCategories, selectBiller } from "../../redux/slices/bbpsSlice";
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
  const dispatch = useDispatch();

  const serviceCode =
    selectedCommissionForPayment?.serviceProviderMapping?.service?.code;

  const isFund = serviceCode === "FUND_REQUEST";
  const isBbps = serviceCode === "BBPS";

  const { canProcess, defaultProvider } = usePermissions(SERVICES.BBPS);
  const serviceProviderMappingId = defaultProvider?.serviceProviderMappingId;

  const { categories, billDetails } = useSelector((s) => s.bbps);

  const [form, setForm] = useState({
    paymentMethod: "",
    network: "",
    category: "",
    operator: "",
    mode: "NONE",
    type: "FLAT",
    value: "",
  });

  const [error, setError] = useState("");

  // ✅ Load categories
  useEffect(() => {
    if (isBbps && canProcess && serviceProviderMappingId) {
      dispatch(getBbpsCategories({ serviceProviderMappingId }));
    }
  }, [isBbps, canProcess, serviceProviderMappingId, dispatch]);

  // ✅ Category change → fetch billers
  useEffect(() => {
    if (isBbps && form.category) {
      dispatch(
        selectBiller({
          biller: form.category,
          serviceProviderMappingId,
        }),
      );
    }
  }, [form.category, isBbps, serviceProviderMappingId, dispatch]);

  // ✅ Prefill
  useEffect(() => {
    if (editData) {
      setForm({
        paymentMethod: editData.paymentMethod || "",
        category: editData.category || "",
        network: editData.network || "",
        operator: editData.operator || "",
        mode: editData.mode || "NONE",
        type: editData.type || "FLAT",
        value: Number(editData.value) / 100,
      });
    } else {
      setForm({
        paymentMethod: "",
        network: "",
        category: "",
        operator: "",
        mode: "NONE",
        type: "FLAT",
        value: "",
      });
    }
  }, [editData]);

  // ✅ SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!commissionSettingId) {
      return setError("Commission setting not selected");
    }

    if (isBbps) {
      if (!form.category) return setError("Category required");
      if (!form.operator) return setError("Operator required");
    }

    if (isFund && !form.paymentMethod) {
      return setError("Payment method required");
    }

    if (form.paymentMethod === "CARD" && !form.network) {
      return setError("Network required for CARD");
    }

    const payload = {
      commissionSettingId,
      paymentMethod: isFund ? form.paymentMethod : null,
      network: form.paymentMethod === "CARD" ? form.network : null,
      category: isBbps ? form.category : null,
      operator: isBbps ? form.operator : null,
      serviceType: serviceCode,
      mode: form.mode, // ✅ FIXED
      type: form.type,
      value: rupeesToPaise(Number(form.value)),
    };

    if (editData?.id) payload.id = editData.id;

    try {
      await dispatch(createCommissionPaymentMethod(payload));
      onSuccess?.();
      onClose?.();
    } catch (err) {
      setError(err.message || "Failed");
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
        <HeaderSection
          title={editData ? "Update Payment Method" : "Add Payment Method"}
          isClose={onClose}
        />

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-500">{error}</div>}

            {/* FUND */}
            {isFund && (
              <>
                <label className="text-sm font-semibold">Payment method</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paymentMethod: e.target.value,
                      network: "",
                    })
                  }
                  className="w-full border border-gray-300  p-2 rounded"
                >
                  <option value="">Select Payment Method</option>
                  {paymentMethods.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>

                {/* Network (CARD only) */}
                {form.paymentMethod === "CARD" && (
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
              </>
            )}

            {/* BBPS */}
            {isBbps && (
              <>
                <label className="text-sm font-semibold">Category</label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      category: e.target.value,
                      operator: "",
                    })
                  }
                  className="w-full border border-gray-300 p-2 rounded"
                >
                  <option value="">Select Category</option>
                  {categories?.data?.flatMap((c) =>
                    c.services.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    )),
                  )}
                </select>

                {form.category && (
                  <>
                    <label className="text-sm font-semibold">Operator</label>
                    <select
                      value={form.operator}
                      onChange={(e) =>
                        setForm({ ...form, operator: e.target.value })
                      }
                      className="w-full border border-gray-300 p-2 rounded"
                    >
                      <option value="">Select Biller</option>
                      {billDetails?.map((b) => (
                        <option key={b.billerId} value={b.billerId}>
                          {b.billerName}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </>
            )}

            {/* MODE */}
            <label className="text-sm font-semibold">Mode</label>
            <select
              value={form.mode}
              onChange={(e) => setForm({ ...form, mode: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="NONE">NONE</option>
              <option value="SURCHARGE">SURCHARGE</option>
              <option value="COMMISSION">COMMISSION</option>
            </select>

            {/* TYPE */}
            <label className="text-sm font-semibold">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border border-gray-300 p-2 rounded"
            >
              <option value="FLAT">FLAT</option>
              <option value="PERCENTAGE">PERCENTAGE</option>
            </select>

            <InputField
              label={form.type === "FLAT" ? "Amount (₹)" : "Percentage (%)"}
              type="number"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
            />

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

              <ButtonField name="Save" type="submit" />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
