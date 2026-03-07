import { useState } from "react";
import { useDispatch } from "react-redux";
import { verifyPan } from "../../redux/slices/panSlice.js";
import ButtonField from "../ui/ButtonField";
import { InputField } from "../ui/InputField";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";

export default function PANVerificationModal({
  panNumber,
  serviceId,
  onSuccess,
  onClose,
}) {
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(false);
  const [idempotencyKey] = useState(uuidv4());

  const handleVerifyPan = async () => {
    try {
      if (!panNumber) {
        toast.error("PAN number required");
        return;
      }

      const cleanPan = panNumber.toUpperCase().trim();

      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
        toast.error("Invalid PAN format");
        return;
      }

      if (!serviceId) {
        toast.error("PAN service not available");
        return;
      }

      setLoading(true);

      const res = await dispatch(
        verifyPan({
          panNumber: cleanPan,
          serviceId,
          idempotencyKey,
        }),
      );

      if (res.data?.status === "VALID") {
        toast.success("PAN Verified Successfully");

        onSuccess(res.data);
        onClose();
      } else {
        toast.error("PAN verification failed");
      }
    } catch (err) {
      toast.error("PAN verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-100 space-y-4">
        <h2 className="text-lg font-bold text-center">PAN Verification</h2>

        <InputField label="PAN Number" value={panNumber} disabled />

        <ButtonField
          name={loading ? "Verifying..." : "Verify PAN"}
          type="button"
          isOpen={handleVerifyPan}
          btncss="w-full py-2 bg-blue-600 text-white rounded-lg"
        />

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
