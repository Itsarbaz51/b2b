import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  createFundRequest,
  verifyFundRequest,
} from "../../../redux/slices/fundSlice";
import { v4 as uuidv4 } from "uuid";
import { CreditCard } from "lucide-react";

import HeaderSection from "../../ui/HeaderSection";
import InputField from "../../ui/InputField";
import ButtonField from "../../ui/ButtonField";

const AddRazorpayFundForm = ({ resetForm, onSuccess, serviceId }) => {
  const [amount, setAmount] = useState("");
  const dispatch = useDispatch();
  const [idempotencyKey] = useState(uuidv4());

  const handleSubmit = async () => {
    if (!amount) return alert("Amount required");
    if (!serviceId) return alert("Service permission missing");

    try {
      const res = await dispatch(
        createFundRequest({
          provider: "RAZORPAY",
          serviceId,
          amount: amount * 100,
          idempotencyKey,
        }),
      );

      const options = {
        key: res?.data?.key,
        amount: res?.data?.amount * 100,
        currency: "INR",
        name: "Wallet Topup",
        description: "Add funds to wallet",
        order_id: res?.data?.orderId,

        handler: async function (response) {
          const verifiedRes = await dispatch(
            verifyFundRequest(res?.data?.transactionId, "VERIFY", {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            }),
          );

          if (verifiedRes?.success) {
            onSuccess?.();
            resetForm();
          }
        },

        modal: {
          ondismiss: function () {
            console.log("Payment popup closed");
          },
        },

        theme: { color: "#2563eb" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto relative">
        <HeaderSection
          title={"Razorpay Payment"}
          tagLine={"Add funds instantly using Razorpay"}
          isClose={resetForm}
        />

        {/* BODY */}
        <div className="p-4 sm:p-6 space-y-5">
          <InputField
            label="Amount"
            name="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <ButtonField
            name="Pay with Razorpay"
            icon={CreditCard}
            isOpen={handleSubmit}
            btncss="w-full bg-blue-600 text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default AddRazorpayFundForm;
