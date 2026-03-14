import { useState } from "react";
import { useDispatch } from "react-redux";
import {
  createFundRequest,
  verifyFundRequest,
} from "../../../redux/slices/fundSlice";
import { v4 as uuidv4 } from "uuid";
import { CreditCard, X } from "lucide-react";

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-300">
          <h2 className="text-lg font-semibold">Razorpay Payment</h2>
          <button onClick={resetForm}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Amount</label>

            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-300 outline-blue-600 rounded-lg px-4 py-2"
              placeholder="Enter amount"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Pay with Razorpay
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddRazorpayFundForm;
