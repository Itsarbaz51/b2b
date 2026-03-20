import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { CreditCard, Landmark, Wallet, ArrowLeft } from "lucide-react";

import AddRazorpayFundForm from "../../components/forms/services/AddRazorpayFundForm";
import AddBankTransferFundForm from "../../components/forms/services/AddBankTransferFundForm";

import { getTransactions } from "../../redux/slices/transactionSlice";
import { createFundRequest } from "../../redux/slices/fundSlice";
import { rupeesToPaise } from "../../utils/lib";
import { SERVICES } from "../../utils/constants";
import NoPermissionsPage from "../NoPermissionsPage";
import { usePermissions } from "../../hooks/usePermission";
import { getCurrentUserProfile } from "../../redux/slices/userSlice";

const FundAddPage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector((s) => s.auth.currentUser);

  const [method, setMethod] = useState(null);
  const [processing, setProcessing] = useState(false);

  const primaryWallet = currentUser?.wallets?.find(
    (w) => w.walletType === "PRIMARY",
  );

  const balance = Number(primaryWallet?.balance || 0);

  const resetForm = () => setMethod(null);

  const fetchRequests = () => {
    dispatch(
      getTransactions({
        type: "FUND_REQUEST",
      }),
    );
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // permission hook
  const { canView, canProcess, providers } = usePermissions(
    SERVICES.FUND_REQUEST,
  );

  const razorpayProvider = providers.find((p) => p.providerCode === "RAZORPAY");

  const bankProvider = providers.find(
    (p) => p.providerCode === "BANK_TRANSFER",
  );

  if (!canView) {
    return <NoPermissionsPage />;
  }

  const handleBankSubmit = async (data) => {
    try {
      setProcessing(true);

      const result = await dispatch(
        createFundRequest({
          ...data,
          amount: rupeesToPaise(data.amount),
        }),
      );

      if (result?.payload?.success) {
        resetForm();
        fetchRequests();
        dispatch(getCurrentUserProfile());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full h-screen flex justify-center items-center">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">Add Funds</h1>
          <p className="text-sm text-gray-500">
            Add money to your wallet using Razorpay or Bank Transfer
          </p>
        </div>

        {/* Wallet Card */}
        <div className="bg-white border border-gray-300 rounded-xl p-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Current Wallet Balance</p>
              <p className="text-xl font-semibold text-gray-800">
                ₹{balance.toFixed(2)}
              </p>
            </div>
          </div>

          <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full">
            Minimum Required ₹100
          </span>
        </div>

        {/* Choose Method */}
        {!method && (
          <div className="bg-white border border-gray-300 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">
              Choose Payment Method
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {canProcess && (
                <>
                  <button
                    onClick={() => setMethod("razorpay")}
                    className="border border-gray-300 rounded-lg p-5 flex flex-col items-center gap-3 hover:border-blue-500 hover:bg-blue-50 transition"
                  >
                    <CreditCard className="text-blue-600" size={28} />
                    <span className="font-medium">Razorpay</span>
                    <span className="text-xs text-gray-500 text-center">
                      Instant payment gateway
                    </span>
                  </button>

                  <button
                    onClick={() => setMethod("bank")}
                    className="border border-gray-300 rounded-lg p-5 flex flex-col items-center gap-3 hover:border-green-500 hover:bg-green-50 transition"
                  >
                    <Landmark className="text-green-600" size={28} />
                    <span className="font-medium">Bank Transfer</span>
                    <span className="text-xs text-gray-500 text-center">
                      Manual bank transfer
                    </span>
                  </button>
                </>
              )}

              {!canProcess && (
                <p className="text-sm text-gray-500 col-span-2 text-center">
                  You don't have permission to add funds.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Razorpay Form */}
        {method === "razorpay" && (
          <div className="space-y-4">
            <button
              onClick={resetForm}
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft size={16} />
              Change payment method
            </button>

            <AddRazorpayFundForm
              resetForm={resetForm}
              onSuccess={fetchRequests}
              serviceProviderMappingId={
                razorpayProvider?.serviceProviderMappingId
              }
            />
          </div>
        )}

        {/* Bank Transfer Form */}
        {method === "bank" && (
          <div className="space-y-4">
            <button
              onClick={resetForm}
              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <ArrowLeft size={16} />
              Change payment method
            </button>

            <AddBankTransferFundForm
              onSubmit={handleBankSubmit}
              resetForm={resetForm}
              isProcessing={processing}
              serviceProviderMappingId={bankProvider?.serviceProviderMappingId}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FundAddPage;
