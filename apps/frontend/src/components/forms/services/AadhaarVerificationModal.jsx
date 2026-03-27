import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  sendAadhaarOtp,
  verifyAadhaarOtp,
} from "../../../redux/slices/aadhaarSlice.js";
import ButtonField from "../../ui/ButtonField.jsx";
import InputField from "../../ui/InputField.jsx";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

export default function AadhaarVerificationModal({
  aadhaarNumber,
  serviceProviderMappingId,
  onSuccess,
  onClose,
}) {
  const dispatch = useDispatch();

  const [step, setStep] = useState("SEND_OTP");
  const [otp, setOtp] = useState("");
  const [referenceId, setReferenceId] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [idempotencyKey] = useState(uuidv4());

  const handleSendOtp = async () => {
    try {
      const cleanAadhaar = aadhaarNumber?.replace(/\D/g, "");

      if (!cleanAadhaar) {
        toast.error("Aadhaar number is required");
        return;
      }

      if (!/^\d{12}$/.test(cleanAadhaar)) {
        toast.error("Aadhaar must be exactly 12 digits");
        return;
      }

      if (!serviceProviderMappingId) {
        toast.error("Aadhaar service not available");
        return;
      }

      setLoading(true);

      const res = await dispatch(
        sendAadhaarOtp({
          aadhaarNumber: cleanAadhaar,
          serviceProviderMappingId,
          idempotencyKey: idempotencyKey,
        }),
      );

      if (res.data?.referenceId) {
        setReferenceId(res.data.referenceId);
        setTransactionId(res.data.transactionId);
        setStep("VERIFY_OTP");
      } else {
        toast.error("Failed to send OTP");
      }
    } catch (err) {
      toast.error("OTP Send Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      if (!otp || !/^\d{4,6}$/.test(otp)) {
        toast.error("Enter valid OTP (4-6 digits)");
        return;
      }

      if (!transactionId || !referenceId) {
        toast.error("Invalid verification session");
        return;
      }

      setLoading(true);

      const res = await dispatch(
        verifyAadhaarOtp({
          transactionId,
          referenceId,
          otp,
        }),
      );

      if (res.data?.status == "VALID") {
        toast.success(res.message);
        onSuccess(res.data);
        onClose();
      } else {
        toast.error("Invalid OTP");
      }
    } catch (err) {
      toast.error("OTP Verification Failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-100 space-y-4">
        <h2 className="text-lg font-bold text-center">Aadhaar Verification</h2>

        {step === "SEND_OTP" && (
          <ButtonField
            name={loading ? "Sending..." : "Send OTP"}
            type="button"
            isOpen={handleSendOtp}
            btncss="w-full py-2 bg-blue-600 text-white rounded-lg"
          />
        )}

        {step === "VERIFY_OTP" && (
          <>
            <InputField
              label="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Enter OTP"
            />

            <ButtonField
              name={loading ? "Verifying..." : "Verify OTP"}
              type="button"
              isOpen={handleVerifyOtp}
              btncss="w-full py-2 bg-green-600 text-white rounded-lg"
            />
          </>
        )}

        <ButtonField
          name="Cancel"
          type="button"
          isOpen={onClose}
          btncss="w-full py-2 bg-gray-400 text-white rounded-lg"
        />
      </div>
    </div>
  );
}
