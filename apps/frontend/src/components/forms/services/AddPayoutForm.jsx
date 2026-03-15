import { useState } from "react";
import { Landmark, ShieldCheck } from "lucide-react";

import InputField from "../../ui/InputField";
import ButtonField from "../../ui/ButtonField";
import CloseBtn from "../../ui/CloseBtn";
import HeaderSection from "../../ui/HeaderSection";

const AddPayoutForm = ({
  resetForm,
  onSubmit,
  onVerify,
  isVerified,
  verifying,
  isLoading,
}) => {
  const [form, setForm] = useState({
    accountNo: "",
    ifscCode: "",
    beneficiaryName: "",
    mobile: "",
    amount: "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.accountNo) newErrors.accountNo = "Account number required";
    if (!form.ifscCode) newErrors.ifscCode = "IFSC required";
    if (!form.amount) newErrors.amount = "Amount required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    onSubmit(form);
  };

  const handleVerify = () => {
    if (!form.accountNo || !form.ifscCode || !form.mobile) {
      return alert("Account No, IFSC & Mobile required");
    }

    onVerify(form, (beneficiaryName) => {
      setForm((prev) => ({
        ...prev,
        beneficiaryName,
      }));
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <HeaderSection
          title={"Create Payout"}
          tagLine={"Transfer funds to bank account"}
          isClose={resetForm}
        />

        {/* BODY */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField
                label="Account Number"
                name="accountNo"
                value={form.accountNo}
                onChange={handleChange}
                error={errors.accountNo}
              />

              <InputField
                label="IFSC Code"
                name="ifscCode"
                value={form.ifscCode}
                onChange={handleChange}
                error={errors.ifscCode}
              />

              <InputField
                label="Mobile"
                name="mobile"
                value={form.mobile}
                onChange={handleChange}
                maxLength={10}
              />

              <InputField
                label="Beneficiary Name"
                name="beneficiaryName"
                value={form.beneficiaryName}
                onChange={handleChange}
              />

              <InputField
                label="Amount"
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                error={errors.amount}
              />
            </div>

            {/* VERIFY */}

            <div className="flex items-center gap-3">
              <ButtonField
                name={isVerified ? "Verified" : "Verify Bank"}
                icon={ShieldCheck}
                isOpen={handleVerify}
                isDisabled={verifying || isVerified}
                btncss="bg-green-600 text-white px-3 py-2 text-sm"
                isLoading={verifying}
              />

              {isVerified && (
                <span className="text-green-600 text-sm font-medium">
                  Account verified
                </span>
              )}
            </div>

            {/* SUBMIT */}

            <div className="flex justify-end pt-3">
              <ButtonField
                name="Send Payout"
                type="submit"
                icon={Landmark}
                isLoading={isLoading}
                isDisabled={!isVerified}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPayoutForm;
