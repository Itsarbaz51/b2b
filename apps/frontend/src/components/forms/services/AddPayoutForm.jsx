import { useEffect, useState } from "react";
import { Landmark, ShieldCheck } from "lucide-react";

import InputField from "../../ui/InputField";
import ButtonField from "../../ui/ButtonField";
import HeaderSection from "../../ui/HeaderSection";
import { DropdownField } from "../../ui/DropdownField";
import { useDispatch, useSelector } from "react-redux";
import {
  clearBeneficiaries,
  fetchBeneficiaries,
} from "../../../redux/slices/beneficiarySlice";
import { useDebounce } from "use-debounce";

const AddPayoutForm = ({
  resetForm,
  onSubmit,
  onVerify,
  isVerified,
  setIsVerified,
  verifying,
  isLoading,
}) => {
  const [form, setForm] = useState({
    transferMode: "IMPS",
    accountNo: "",
    ifscCode: "",
    beneficiaryName: "",
    mobile: "",
    amount: "",
    vpa: "",
    beneficiaryId: "",
  });

  const [errors, setErrors] = useState({});
  const [debouncedMobile] = useDebounce(form.mobile, 500);
  const dispatch = useDispatch();

  const { beneficiaries = [] } = useSelector((state) => state.beneficiary);
  /* ---------------- CHANGE ---------------- */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (["accountNo", "ifscCode", "mobile"].includes(name)) {
      setIsVerified(false);
    }

    if (name === "transferMode") {
      setIsVerified(false);
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  useEffect(() => {
    if (debouncedMobile?.length >= 10) {
      dispatch(fetchBeneficiaries(debouncedMobile));
    }
  }, [debouncedMobile]);

  useEffect(() => {
    if (debouncedMobile?.length < 10) {
      dispatch(clearBeneficiaries());
    }
  }, [debouncedMobile]);

  /* ---------------- VALIDATE ---------------- */

  const validate = () => {
    const newErrors = {};

    if (!form.mobile) newErrors.mobile = "Mobile required";
    if (!form.amount) newErrors.amount = "Amount required";
    if (!form.beneficiaryName)
      newErrors.beneficiaryName = "Beneficiary required";

    if (form.transferMode === "UPI") {
      if (!form.vpa) newErrors.vpa = "VPA required";
    } else {
      if (!form.accountNo) newErrors.accountNo = "Account number required";
      if (!form.ifscCode) newErrors.ifscCode = "IFSC required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* ---------------- SUBMIT ---------------- */

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit(form);
  };

  /* ---------------- VERIFY ---------------- */

  const handleVerify = () => {
    if (!form.accountNo || !form.ifscCode || !form.mobile) {
      setErrors({
        accountNo: !form.accountNo && "Required",
        ifscCode: !form.ifscCode && "Required",
        mobile: !form.mobile && "Required",
      });
      return;
    }

    onVerify(form, (beneficiaryName) => {
      setForm((prev) => ({
        ...prev,
        beneficiaryName,
      }));
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <HeaderSection
          title="Create Payout"
          tagLine="Transfer funds"
          isClose={resetForm}
        />

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 🔥 TRANSFER MODE */}
            <DropdownField
              label="Transfer Mode"
              name="transferMode"
              value={form.transferMode}
              onChange={handleChange}
              options={[
                { label: "IMPS", value: "IMPS" },
                { label: "NEFT", value: "NEFT" },
                { label: "UPI", value: "UPI" },
              ]}
            />

            {/* 🔥 COMMON FIELDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <InputField
                label="Mobile"
                name="mobile"
                type="number"
                value={form.mobile}
                onChange={handleChange}
                error={errors.mobile}
                maxLength={10}
              />
              {beneficiaries.length > 0 && (
                <DropdownField
                  label="Select Bank"
                  value={form.beneficiaryId || ""}
                  options={beneficiaries.map((b) => ({
                    id: b.id,
                    label: `${b.name} - ${b.accountNumber} ${
                      b.isVerified ? "✅" : "⚠️"
                    }`,
                  }))}
                  onChange={(e) => {
                    const value = e.target.value;

                    const selected = beneficiaries.find(
                      (b) => String(b.id) === String(value),
                    );

                    if (!selected) return;

                    setForm((prev) => ({
                      ...prev,
                      beneficiaryId: selected.id,
                      accountNo: selected.accountNumber,
                      ifscCode: selected.ifsc,
                      beneficiaryName: selected.name,
                    }));

                    setIsVerified(selected.isVerified);
                  }}
                />
              )}

              <InputField
                label="Amount"
                name="amount"
                type="number"
                value={form.amount}
                onChange={handleChange}
                error={errors.amount}
              />

              <InputField
                label="Beneficiary Name"
                name="beneficiaryName"
                value={form.beneficiaryName}
                onChange={handleChange}
                error={errors.beneficiaryName}
                disabled={isVerified}
              />

              {/* 🔥 UPI */}
              {form.transferMode === "UPI" && (
                <InputField
                  label="VPA (UPI ID)"
                  name="vpa"
                  value={form.vpa}
                  onChange={handleChange}
                  error={errors.vpa}
                />
              )}

              {/* 🔥 BANK */}
              {form.transferMode !== "UPI" && (
                <>
                  <InputField
                    label="Account Number"
                    name="accountNo"
                    value={form.accountNo}
                    onChange={handleChange}
                    error={errors.accountNo}
                    disabled={isVerified}
                  />

                  <InputField
                    label="IFSC Code"
                    name="ifscCode"
                    value={form.ifscCode}
                    onChange={handleChange}
                    error={errors.ifscCode}
                    disabled={isVerified}
                  />
                </>
              )}
            </div>

            {/* 🔥 VERIFY ONLY FOR BANK */}
            {form.transferMode !== "UPI" && (
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
                  <span className="text-green-600 text-sm">
                    Account verified
                  </span>
                )}
              </div>
            )}

            {/* 🔥 SUBMIT */}
            <div className="flex justify-end">
              <ButtonField
                name="Send Payout"
                type="submit"
                icon={Landmark}
                isLoading={isLoading}
                isDisabled={isLoading}
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddPayoutForm;
