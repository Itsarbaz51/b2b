import { useCallback, useEffect, useState } from "react";
import { Landmark, Upload } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { getAdminPrimaryBank } from "../../../redux/slices/bankSlice";
import { v4 as uuidv4 } from "uuid";

import HeaderSection from "../../ui/HeaderSection";
import InputField from "../../ui/InputField";
import ButtonField from "../../ui/ButtonField";
import { FileUpload } from "../../ui/FileUpload";

const AddBankTransferFundForm = ({
  onSubmit,
  resetForm,
  isProcessing,
  serviceProviderMappingId,
}) => {
  const [idempotencyKey] = useState(uuidv4());

  const dispatch = useDispatch();
  const { bankDetail: adminBank } = useSelector((s) => s.bank);

  const [form, setForm] = useState({
    amount: "",
    rrn: "",
    transactionDate: new Date().toISOString().split("T")[0],
    paymentImage: null,
    serviceProviderMappingId,
    idempotencyKey,
  });

  const [errors, setErrors] = useState({});
  const [filePreview, setFilePreview] = useState(null);

  const fetchHandle = useCallback(() => {
    dispatch(getAdminPrimaryBank());
  }, [dispatch]);

  useEffect(() => {
    fetchHandle();
  }, [fetchHandle]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((p) => ({
      ...p,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setForm((p) => ({
      ...p,
      paymentImage: file,
    }));

    if (file.type === "application/pdf") {
      setFilePreview("PDF");
    } else {
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.amount) newErrors.amount = "Amount required";
    if (!form.rrn) newErrors.rrn = "RRN required";
    if (!form.paymentImage) newErrors.paymentImage = "Receipt required";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <HeaderSection
          title={"Bank Transfer"}
          tagLine={"Add fund using bank transfer"}
          isClose={resetForm}
        />

        <div className="p-4 sm:p-6 space-y-5">
          {/* ADMIN BANK CARD */}
          {adminBank && (
            <div className="p-4 bg-blue-50 border border-gray-300 rounded-lg">
              <p className="font-semibold text-gray-800">
                {adminBank.accountHolder}
              </p>

              <p className="text-gray-600">{adminBank.bankName}</p>

              <div className="text-sm text-gray-600 mt-1">
                {adminBank.accountNumber} • {adminBank.ifsc}
              </div>
            </div>
          )}

          {/* INPUTS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField
              label="Amount"
              name="amount"
              type="number"
              value={form.amount}
              onChange={handleChange}
              error={errors.amount}
            />

            <InputField
              label="Transaction Date"
              name="transactionDate"
              type="date"
              value={form.transactionDate}
              onChange={handleChange}
            />

            <InputField
              label="RRN / UTR Number"
              name="rrn"
              value={form.rrn}
              onChange={handleChange}
              error={errors.rrn}
            />
          </div>

          {/* FILE UPLOAD */}

          <FileUpload
            label="Payment Receipt"
            name="paymentImage"
            icon={Upload}
            onChange={handleFileChange}
            filePreview={filePreview}
            file={form.paymentImage}
            error={errors.paymentImage}
          />

          {/* SUBMIT */}

          <div className="flex justify-end pt-3">
            <ButtonField
              name="Submit Request"
              icon={Landmark}
              isLoading={isProcessing}
              isOpen={handleSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBankTransferFundForm;
