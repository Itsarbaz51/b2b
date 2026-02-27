import { useState, useEffect } from "react";
import { Upload } from "lucide-react";
import { InputField } from "../ui/InputField";
import { DropdownField } from "../ui/DropdownField";
import { FileUpload } from "../ui/FileUpload";
import ButtonField from "../ui/ButtonField";
import CloseBtn from "../ui/CloseBtn";

const AddBank = ({
  accountForm = {},
  onChange,
  onFileChange,
  onSubmit,
  onCancel,
  editingAccountId,
  accountTypes = [],
  errors = {},
  isLoading = false,
}) => {
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localErrors, setLocalErrors] = useState({});

  useEffect(() => {
    if (editingAccountId && accountForm.bankProofFile) {
      setPreview(accountForm.bankProofFile);
    }
  }, [editingAccountId, accountForm.bankProofFile]);

  useEffect(() => {
    if (accountForm.bankProofFile instanceof File) {
      const objectUrl = URL.createObjectURL(accountForm.bankProofFile);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [accountForm.bankProofFile]);

  const handleSubmit = async () => {
    if (isSubmitting || isLoading) return;

    // Final validation before submit
    const validationErrors = {};

    if (accountForm?.ifscCode) {
      const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;
      if (accountForm.ifscCode.length < 11) {
        validationErrors.ifscCode = "IFSC code must be 11 characters";
      } else if (!ifscPattern.test(accountForm.ifscCode)) {
        validationErrors.ifscCode = "Invalid IFSC code format: ASDF0007728.";
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setLocalErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIFSCChange = (e) => {
    const value = e.target.value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 11);

    onChange({ target: { name: "ifscCode", value } });

    // Clear local error when user starts typing
    if (localErrors.ifscCode) {
      setLocalErrors((prev) => ({ ...prev, ifscCode: "" }));
    }
  };

  const handleIFSCBlur = (e) => {
    const value = e.target.value;

    if (!value) {
      setLocalErrors((prev) => ({ ...prev, ifscCode: "" }));
      return;
    }

    const ifscPattern = /^[A-Z]{4}0[A-Z0-9]{6}$/;

    if (value.length < 11) {
      setLocalErrors((prev) => ({
        ...prev,
        ifscCode: "IFSC code must be 11 characters",
      }));
    } else if (!ifscPattern.test(value)) {
      setLocalErrors((prev) => ({
        ...prev,
        ifscCode: "Invalid IFSC code format. Format: XXXX0XXXXXX",
      }));
    } else {
      setLocalErrors((prev) => ({ ...prev, ifscCode: "" }));
    }
  };

  // Combine props errors with local errors
  const allErrors = { ...errors, ...localErrors };

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-xs bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-gray-50 p-6 border border-gray-200 rounded-lg shadow-lg w-full max-w-3xl relative">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {editingAccountId ? "Edit Account" : "Add New Account"}
        </h3>
        <p>{accountForm?.bankRejectionReason}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Account Holder Name */}
          <InputField
            label="Account Holder Name"
            name="accountHolder"
            value={accountForm?.accountHolder || ""}
            onChange={onChange}
            placeholder="Enter account holder name"
            error={allErrors.accountHolder}
            disabled={isSubmitting || isLoading}
          />

          {/* Account Number */}
          <InputField
            label="Account Number"
            name="accountNumber"
            type="text"
            value={accountForm?.accountNumber || ""}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 18)
                onChange({ target: { name: "accountNumber", value } });
            }}
            placeholder="Enter account number"
            error={allErrors.accountNumber}
            maxLength={18}
            inputMode="numeric"
            disabled={isSubmitting || isLoading}
          />

          {/* Phone Number */}
          <InputField
            label="Phone Number"
            name="phoneNumber"
            type="text"
            value={accountForm?.phoneNumber || ""}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              if (value.length <= 10)
                onChange({ target: { name: "phoneNumber", value } });
            }}
            placeholder="10-digit phone number"
            error={allErrors.phoneNumber}
            maxLength={10}
            inputMode="numeric"
            disabled={isSubmitting || isLoading}
          />

          {/* Account Type */}
          <DropdownField
            label="Account Type"
            name="accountType"
            value={accountForm?.accountType || ""}
            onChange={onChange}
            options={accountTypes.map((type) => ({
              id: type.value,
              stateName: type.label,
            }))}
            error={allErrors.accountType}
            placeholder="Select account type"
            disabled={isSubmitting || isLoading}
          />

          {/* IFSC Code */}
          <InputField
            label="IFSC Code"
            name="ifscCode"
            value={accountForm?.ifscCode || ""}
            onChange={handleIFSCChange}
            onBlur={handleIFSCBlur}
            placeholder="e.g., SBIN0000123"
            error={allErrors.ifscCode}
            maxLength={11}
            disabled={isSubmitting || isLoading}
          />

          {/* Bank Name */}
          <InputField
            label="Bank Name"
            name="bankName"
            value={accountForm?.bankName || ""}
            onChange={onChange}
            placeholder="Enter bank name"
            error={allErrors.bankName}
            disabled={isSubmitting || isLoading}
          />

          {/* 🔹 Bank Proof Document */}
          <div className="col-span-1 md:col-span-2">
            <FileUpload
              label="Bank Proof Document"
              name="bankProofFile"
              accept=".pdf,.jpg,.jpeg,.png"
              icon={Upload}
              onChange={onFileChange}
              filePreview={preview}
              file={accountForm?.bankProofFile}
              error={allErrors.bankProofFile}
              isPreFilled={editingAccountId && accountForm.bankProofFile}
              disabled={isSubmitting || isLoading}
            />
          </div>

          {/* Primary Checkbox */}
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="isPrimary"
                checked={accountForm?.isPrimary || false}
                onChange={onChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                disabled={isSubmitting || isLoading}
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Set as Primary Account
              </span>
            </label>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <ButtonField
            name={editingAccountId ? "Update Account" : "Add Account"}
            type="button"
            isOpen={handleSubmit}
            isLoading={isSubmitting || isLoading}
            btncss="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          />
          <CloseBtn
            isClose={onCancel}
            disabled={isSubmitting || isLoading}
            title="Cancel"
            variant="text"
          >
            Cancel
          </CloseBtn>
        </div>
      </div>
    </div>
  );
};

export default AddBank;
