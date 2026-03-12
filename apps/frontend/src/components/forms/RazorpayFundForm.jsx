import { useState } from "react";
import { CreditCard, X } from "lucide-react";

const RazorpayFundForm = ({ onSubmit, resetForm, isProcessing }) => {
  const [amount, setAmount] = useState("");

  const handleSubmit = () => {
    if (!amount) return alert("Amount required");
    onSubmit({ amount });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg">
        <div className="flex justify-between items-center p-6 border-b">
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
              className="w-full border rounded-lg px-4 py-2"
              placeholder="Enter amount"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isProcessing}
            className="w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            {isProcessing ? "Processing..." : "Pay with Razorpay"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RazorpayFundForm;
