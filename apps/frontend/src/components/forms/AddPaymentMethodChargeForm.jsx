import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import HeaderSection from "../ui/HeaderSection";
import InputField from "../ui/InputField";
import ButtonField from "../ui/ButtonField";
import { DropdownField } from "../ui/DropdownField";
import { paisaToRupee, rupeesToPaise } from "../../utils/lib";
import { createPaymentMethodCharge } from "../../redux/slices/serviceSlice";

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
  mappingId,
  editData,
  onClose,
  onSuccess,
}) {
  const dispatch = useDispatch();

  const [form, setForm] = useState({
    paymentMethod: "",
    network: "",
    type: "FLAT",
    value: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    if (editData) {
      setForm({
        paymentMethod: editData.paymentMethod,
        network: editData.network || "",
        type: editData.type,
        value: paisaToRupee(editData.value), 
      });
    }
  }, [editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!mappingId) return setError("Mapping required");

    if (!form.paymentMethod) {
      return setError("Payment method required");
    }

    if (form.type === "PERCENTAGE" && Number(form.value) > 100) {
      return setError("Percentage cannot exceed 100%");
    }

    const payload = {
      serviceProviderMappingId: mappingId,
      paymentMethod: form.paymentMethod,
      network: form.paymentMethod === "CARD" ? form.network : null,
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

            <DropdownField
              label="Payment Method"
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
              options={paymentMethods}
            />

            {form.paymentMethod === "CARD" && (
              <DropdownField
                label="Card Network"
                value={form.network}
                onChange={(e) => setForm({ ...form, network: e.target.value })}
                options={networks}
              />
            )}

            <DropdownField
              label="Type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              options={types}
            />

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
