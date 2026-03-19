import { useState } from "react";
import InputField from "../ui/InputField";
import ButtonField from "../ui/ButtonField";
import HeaderSection from "../ui/HeaderSection";
import { useDispatch, useSelector } from "react-redux";
import { transferCommissionToPrimary } from "../../redux/slices/walletSlice";
import { v4 as uuidv4 } from "uuid";
import { rupeesToPaise } from "../../utils/lib";

const TransferCommissionForm = ({ onClose, commissionWallet }) => {
  const dispatch = useDispatch();
  const { isLoading } = useSelector((state) => state.wallet);
  const [idempotencyKey] = useState(uuidv4());

  const [form, setForm] = useState({
    amount: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // handle input
  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, "");

    setForm((prev) => ({
      ...prev,
      amount: value,
    }));

    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: "" }));
    }
  };

  // submit
  const handleSubmit = async () => {
    if (isSubmitting || isLoading) return;

    const validationErrors = {};

    if (!form.amount) {
      validationErrors.amount = "Amount is required";
    } else if (form.amount <= 0n) {
      validationErrors.amount = "Invalid amount";
    } else if (commissionWallet && form.amount > commissionWallet.balance) {
      validationErrors.amount = "Insufficient commission balance";
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await dispatch(
        transferCommissionToPrimary({
          amount: Number(rupeesToPaise(form.amount)),
          idempotencyKey,
        }),
      );

      onClose(); // close modal on success
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-xs flex items-center justify-center z-50">
      <div className="bg-gray-50  rounded-2xl shadow-lg w-full max-w-md">
        {/* Header */}
        <HeaderSection
          title="Transfer Commission"
          tagLine="Move your commission balance to primary wallet"
          isClose={onClose}
        />

        {/* Body */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Available Balance */}
            <div className="text-sm text-gray-600">
              Available Commission:{" "}
              <span className="font-semibold text-gray-800">
                ₹{commissionWallet?.balance || 0}
              </span>
            </div>

            {/* Amount Input */}
            <InputField
              label="Amount"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              error={errors.amount}
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6 justify-end">
            <ButtonField
              name={isSubmitting || isLoading ? "Processing..." : "Transfer"}
              type="button"
              isOpen={handleSubmit}
              isLoading={isSubmitting || isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferCommissionForm;
