import React from "react";
import { X, Landmark, CreditCard } from "lucide-react";

const AddFundRequest = ({
  paymentMethod,
  showAddNew,
  setShowAddNew, // Add this prop
  selectedAccount,
  setSelectedAccount, // Add this prop
  savedAccounts,
  form,
  setForm, // Add this prop
  isProcessing,
  handleInputChange,
  handleFileChange,
  handleRazorpayPayment,
  handleBankTransferSubmit,
  handleAccountSelect,
  resetForm,
}) => {
  const isBankTransfer = paymentMethod === "bank_transfer";
  const isRazorpay = paymentMethod === "razorpay";

  const getPaymentMethodIcon = () => {
    return isRazorpay ? CreditCard : Landmark;
  };

  const PaymentIcon = getPaymentMethodIcon();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${
          isRazorpay ? "max-w-md" : "max-w-2xl"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PaymentIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {isRazorpay ? "Razorpay Payment" : "Bank Transfer Details"}
              </h2>
              <p className="text-sm text-gray-600">
                {isRazorpay
                  ? "Secure online payment"
                  : "Transfer funds from your bank account"}
              </p>
            </div>
          </div>
          <button
            onClick={resetForm}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Bank Account Selection */}
          {isBankTransfer && (
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Bank Account *
              </label>

              {!showAddNew ? (
                <div className="space-y-3">
                  <select
                    value={selectedAccount?.id || ""}
                    onChange={(e) => {
                      const account = savedAccounts.find(
                        (acc) => acc.id === parseInt(e.target.value)
                      );
                      if (account) handleAccountSelect(account);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select a saved account</option>
                    {savedAccounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.accountHolder} - {account.bankName} (
                        {account.account})
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAddNew(true);
                      setSelectedAccount(null);
                      setForm((prev) => ({
                        ...prev,
                        account: "",
                        ifsc: "",
                        bankName: "",
                        accountHolder: "",
                      }));
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add new bank account
                  </button>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-blue-800">
                      New Bank Account
                    </h3>
                    <button
                      onClick={() => setShowAddNew(false)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Use saved account
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Holder Name *
                      </label>
                      <input
                        type="text"
                        name="accountHolder"
                        value={form.accountHolder}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter account holder name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Account Number *
                      </label>
                      <input
                        type="text"
                        name="account"
                        value={form.account}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter account number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        IFSC Code *
                      </label>
                      <input
                        type="text"
                        name="ifsc"
                        value={form.ifsc}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter IFSC code"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Bank Name *
                      </label>
                      <input
                        type="text"
                        name="bankName"
                        value={form.bankName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter bank name"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedAccount && !showAddNew && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-600 mb-2">
                    Selected Account
                  </p>
                  <div className="space-y-1">
                    <p className="font-semibold text-gray-800">
                      {selectedAccount.accountHolder}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedAccount.bankName}
                    </p>
                    <div className="flex gap-4 text-xs text-gray-500">
                      <span>Account: {selectedAccount.account}</span>
                      <span>IFSC: {selectedAccount.ifsc}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Amount Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                ₹
              </span>
              <input
                type="number"
                name="amount"
                value={form.amount}
                onChange={handleInputChange}
                placeholder="Enter amount"
                min="1"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Bank Transfer Specific Fields */}
          {isBankTransfer && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RRN/UTR Number *
                  </label>
                  <input
                    type="text"
                    name="rrn"
                    value={form.rrn}
                    onChange={handleInputChange}
                    placeholder="Enter RRN/UTR number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Date *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Receipt *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".png,.jpg,.jpeg,.pdf"
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label
                    htmlFor="receipt-upload"
                    className="cursor-pointer block"
                  >
                    <div className="text-gray-400 mb-2">
                      <CreditCard className="w-8 h-8 mx-auto" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      Click to upload receipt
                    </p>
                    <p className="text-xs text-gray-400">
                      PNG, JPG, JPEG, PDF up to 5MB
                    </p>
                  </label>
                </div>
                {form.file && (
                  <p className="text-sm text-green-600 mt-2 flex items-center gap-1">
                    <span>✓</span>
                    {form.file.name}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={resetForm}
              disabled={isProcessing}
              className="px-6 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={
                isRazorpay ? handleRazorpayPayment : handleBankTransferSubmit
              }
              disabled={isProcessing}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : isRazorpay ? (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay with Razorpay
                </>
              ) : (
                "Submit Fund Request"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddFundRequest;
