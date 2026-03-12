import { useCallback, useEffect, useMemo, useState } from "react";
import { X, Landmark, Upload } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { getAdminPrimaryBank } from "../../redux/slices/bankSlice";
import { v4 as uuidv4 } from "uuid";
import { usePermissions } from "../hooks/usePermission";

const AddBankTransferFundForm = ({ onSubmit, resetForm, isProcessing }) => {
  const [idempotencyKey] = useState(uuidv4());

  const dispatch = useDispatch();
  const { bankDetail: adminBank } = useSelector((s) => s.bank);

  const { normalizedPermissions } = usePermissions();

  const fundServiceId = useMemo(() => {
    const service = normalizedPermissions?.find(
      (s) => s.code === "FUND_REQUEST",
    );
    return service?.id || null;
  }, [normalizedPermissions]);

  const [form, setForm] = useState({
    provider: "BANK_TRANSFER",
    amount: "",
    rrn: "",
    transactionDate: new Date().toISOString().split("T")[0],
    paymentImage: null,
    serviceId: fundServiceId,
    idempotencyKey,
  });

  const fetchHandle = useCallback(() => {
    dispatch(getAdminPrimaryBank());
  }, [dispatch]);

  useEffect(() => {
    fetchHandle();
  }, [fetchHandle]);

  const handleSubmit = () => {
    if (!form.amount) return alert("Amount required");
    if (!form.rrn) return alert("RRN required");
    if (!form.paymentImage) return alert("Receipt required");
    if (!form.serviceId) return alert("Service ID missing");

    onSubmit(form);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-300">
          <div className="flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Bank Transfer</h2>
          </div>

          <button onClick={resetForm} className="p-2 rounded hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Admin Bank Card */}
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

          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Amount
              </label>

              <input
                type="number"
                placeholder="Enter amount"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.amount}
                onChange={(e) =>
                  setForm((p) => ({ ...p, amount: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 mb-1 block">
                Transaction Date
              </label>

              <input
                type="date"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
                value={form.transactionDate}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    transactionDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* RRN */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-1 block">
              RRN / UTR Number
            </label>

            <input
              type="text"
              placeholder="Enter UTR / RRN"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              value={form.rrn}
              onChange={(e) => setForm((p) => ({ ...p, rrn: e.target.value }))}
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">
              Upload Payment Receipt
            </label>

            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50">
              <Upload className="w-6 h-6 text-gray-400 mb-2" />

              <p className="text-sm text-gray-600">Click to upload receipt</p>

              <input
                type="file"
                className="hidden"
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    paymentImage: e.target.files[0],
                  }))
                }
              />
            </label>

            {form.paymentImage && (
              <p className="text-xs text-gray-500 mt-2">
                {form.paymentImage.name}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-5 border-t border-gray-300">
          <button
            onClick={resetForm}
            className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {isProcessing ? "Processing..." : "Submit Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddBankTransferFundForm;
