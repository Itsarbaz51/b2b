import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import HeaderSection from "../ui/HeaderSection";
import InputField from "../ui/InputField";
import ButtonField from "../ui/ButtonField";

import { paisaToRupee, rupeesToPaise } from "../../utils/lib";
import { createPaymentMethodCharge } from "../../redux/slices/serviceSlice";

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

const types = [
  { label: "FLAT", value: "FLAT" },
  { label: "PERCENTAGE", value: "PERCENTAGE" },
];

export default function AddPaymentMethodChargeForm({
  selectedChargeMapping,
  mappingId,
  editData,
  onClose,
  onSuccess,
}) {
  const dispatch = useDispatch();

  //  SERVICE DETECTION
  const serviceCode = selectedChargeMapping?.service?.code;

  const isFund = serviceCode === "FUND_REQUEST";
  const isBbps = serviceCode === "BBPS";

  //  BBPS CATEGORY FETCH
  const { canProcess, defaultProvider } = usePermissions(SERVICES.BBPS);
  const serviceProviderMappingId = defaultProvider?.serviceProviderMappingId;

  const { categories } = useSelector((s) => s.bbps);

  useEffect(() => {
    if (isBbps && canProcess && serviceProviderMappingId) {
      dispatch(getBbpsCategories({ serviceProviderMappingId }));
    }
  }, [isBbps, canProcess, serviceProviderMappingId]);

  const [form, setForm] = useState({
    paymentMethod: "",
    network: "",
    category: "",
    type: "FLAT",
    value: "",
  });

  const [error, setError] = useState("");

  //  PREFILL
  useEffect(() => {
    if (editData) {
      setForm({
        paymentMethod: editData.paymentMethod || "",
        network: editData.network || "",
        category: editData.category || "",
        type: editData.type,
        value: paisaToRupee(editData.value),
      });
    }
  }, [editData]);

  //  SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!mappingId) return setError("Mapping required");

    // BBPS validation
    if (isBbps && !form.category) {
      return setError("Service required for BBPS");
    }

    // FUND validation
    if (isFund && !form.paymentMethod) {
      return setError("Payment method required");
    }

    if (form.paymentMethod === "CARD" && !form.network) {
      return setError("Network required for CARD");
    }

    if (form.type === "PERCENTAGE" && Number(form.value) > 100) {
      return setError("Percentage cannot exceed 100%");
    }

    const payload = {
      serviceProviderMappingId: mappingId,
      paymentMethod: isFund ? form.paymentMethod : null,
      network: form.paymentMethod === "CARD" ? form.network : null,
      category: isBbps ? form.category : null,
      type: form.type,
      value: rupeesToPaise(Number(form.value)),
    };

    if (editData?.id) payload.id = editData.id;

    try {
      await dispatch(createPaymentMethodCharge(payload));
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!editData?.id) return;

    if (!window.confirm("Delete charge?")) return;

    try {
      await dispatch(
        createPaymentMethodCharge({
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl">
        <HeaderSection
          title={editData ? "Update Payment Charge" : "Add Payment Charge"}
          isClose={onClose}
        />

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-100 text-red-600 p-2 rounded">{error}</div>
            )}

            {/*  FUND REQUEST */}
            {isFund && (
              <>
                <select
                  value={form.paymentMethod}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      paymentMethod: e.target.value,
                      network: "",
                    })
                  }
                  className="w-full border p-2 rounded"
                >
                  <option value="">Select Payment Method</option>
                  {paymentMethods.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>

                {form.paymentMethod === "CARD" && (
                  <select
                    value={form.network}
                    onChange={(e) =>
                      setForm({ ...form, network: e.target.value })
                    }
                    className="w-full border p-2 rounded"
                  >
                    <option value="">Select Network</option>
                    {networks.map((n) => (
                      <option key={n.value} value={n.value}>
                        {n.label}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}

            {/*  BBPS */}
            {isBbps && (
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border p-2 rounded"
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
            )}

            {/* TYPE */}
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full border p-2 rounded"
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>

            {/* VALUE */}
            <InputField
              label={
                form.type === "PERCENTAGE" ? "Percentage (%)" : "Amount (₹)"
              }
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
