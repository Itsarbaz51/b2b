import React, { useState } from "react";
import {
  CreditCard,
  Users,
  Send,
  Plus,
  Upload,
  ExternalLink,
  Eye,
  Copy,
} from "lucide-react";

const CardPayout = () => {
  const [activeTab, setActiveTab] = useState("senders");
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("");

  const recentTransactions = [
    {
      id: "TECDREF00453",
      amount: "₹1,000",
      beneficiary: "Harish Karthick K",
      status: "SUCCESS",
      time: "2 mins ago",
      type: "Instant",
      utr: "507716981734",
    },
    {
      id: "TECDREF00454",
      amount: "₹5,500",
      beneficiary: "Sathya Narayanan",
      status: "SUCCESS",
      time: "15 mins ago",
      type: "T+1",
      utr: "507716981735",
    },
    {
      id: "TECDREF00455",
      amount: "₹2,300",
      beneficiary: "Anjali Verma",
      status: "PENDING",
      time: "1 hour ago",
      type: "Instant",
      utr: "-",
    },
    {
      id: "TECDREF00456",
      amount: "₹8,900",
      beneficiary: "Rahul Sharma",
      status: "SUCCESS",
      time: "2 hours ago",
      type: "Instant",
      utr: "507716981736",
    },
    {
      id: "TECDREF00457",
      amount: "₹3,200",
      beneficiary: "Priya Singh",
      status: "SUCCESS",
      time: "3 hours ago",
      type: "T+1",
      utr: "507716981737",
    },
  ];

  const senders = [
    {
      senderId: "TEUCDPREF002",
      name: "Harish Karthick",
      pan: "ABCDE3702Q",
      card: "****3232",
      status: "Active",
      phone: "9999988888",
    },
    {
      senderId: "TEUCDPREF003",
      name: "Rajesh Kumar",
      pan: "BCDEF4803R",
      card: "****5656",
      status: "Active",
      phone: "9999977777",
    },
    {
      senderId: "TEUCDPREF004",
      name: "Priya Singh",
      pan: "CDEFG5904S",
      card: "****7878",
      status: "Pending",
      phone: "9999966666",
    },
  ];

  const beneficiaries = [
    {
      beneficiaryId: "CARDBENE4",
      name: "Harish Karthick K",
      account: "****232323",
      ifsc: "IDIB000M129",
      status: "ACTIVE",
      fullAccount: "2323232323",
    },
    {
      beneficiaryId: "CARDBENE5",
      name: "Sathya Narayanan",
      account: "****656565",
      ifsc: "HDFC0001234",
      status: "ACTIVE",
      fullAccount: "6565656565",
    },
    {
      beneficiaryId: "CARDBENE6",
      name: "Anjali Verma",
      account: "****989898",
      ifsc: "ICIC0005678",
      status: "PENDING",
      fullAccount: "9898989898",
    },
  ];

  const openModal = (type) => {
    setModalType(type);
    setShowModal(true);
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      Active: "bg-green-500 text-white",
      ACTIVE: "bg-green-500 text-white",
      SUCCESS: "bg-green-500 text-white",
      Pending: "bg-yellow-500 text-white",
      PENDING: "bg-yellow-500 text-white",
      FAILED: "bg-red-500 text-white",
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
          styles[status] || "bg-gray-500 text-white"
        }`}
      >
        {status}
      </span>
    );
  };

  const menuItems = [
    { id: "senders", label: "Senders", icon: Users },
    { id: "beneficiaries", label: "Beneficiaries", icon: CreditCard },
    { id: "transactions", label: "Transactions", icon: Send },
  ];

  return (
    <div>
      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage your CC payouts efficiently
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => openModal("transaction")}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>New Payout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex p-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                activeTab === item.id
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        <main className="flex-1 overflow-y-auto py-8">
          {activeTab === "senders" && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    All Senders
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage credit card senders and their details
                  </p>
                </div>
                <button
                  onClick={() => openModal("sender")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Sender</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Sender ID
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        PAN
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Card
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {senders.map((sender, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6 text-sm font-mono text-blue-600 font-medium">
                          {sender.senderId}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-900 font-medium">
                          {sender.name}
                        </td>
                        <td className="py-4 px-6 text-sm font-mono text-gray-600">
                          {sender.pan}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {sender.phone}
                        </td>
                        <td className="py-4 px-6 text-sm font-mono text-gray-600">
                          {sender.card}
                        </td>
                        <td className="py-4 px-6">
                          <StatusBadge status={sender.status} />
                        </td>
                        <td className="py-4 px-6">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                            <Upload className="w-4 h-4" />
                            <span>Upload Card</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "beneficiaries" && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    All Beneficiaries
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage bank account beneficiaries
                  </p>
                </div>
                <button
                  onClick={() => openModal("beneficiary")}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Beneficiary</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Beneficiary ID
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Account
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        IFSC
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {beneficiaries.map((bene, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6 text-sm font-mono text-blue-600 font-medium">
                          {bene.beneficiaryId}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-900 font-medium">
                          {bene.name}
                        </td>
                        <td className="py-4 px-6 text-sm font-mono text-gray-600">
                          {bene.account}
                        </td>
                        <td className="py-4 px-6 text-sm font-mono text-gray-600">
                          {bene.ifsc}
                        </td>
                        <td className="py-4 px-6">
                          <StatusBadge status={bene.status} />
                        </td>
                        <td className="py-4 px-6">
                          <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1">
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    All Transactions
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Complete transaction history and details
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openModal("transaction")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 font-medium"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Create Collection URL</span>
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Beneficiary
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        UTR
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-6 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {recentTransactions.map((txn, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-6 text-sm font-mono text-blue-600 font-medium">
                          {txn.id}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-900">
                          {txn.beneficiary}
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-gray-900">
                          {txn.amount}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {txn.type}
                        </td>
                        <td className="py-4 px-6">
                          {txn.utr !== "-" ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-mono text-gray-600">
                                {txn.utr}
                              </span>
                              <button className="text-gray-400 hover:text-gray-600">
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <StatusBadge status={txn.status} />
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-500">
                          {txn.time}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 backdrop-blur-xs bg-black/10 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-5 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                Add New {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
              </h3>
            </div>
            <div className="px-6 py-6">
              <div className="space-y-4">
                {modalType === "sender" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Name
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PAN Number
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="ABCDE1234F"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="10-digit mobile number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="16-digit card number"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV
                        </label>
                        <input
                          type="password"
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="123"
                          maxLength="3"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expiry
                        </label>
                        <input
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="MM/YYYY"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Aadhar Number (Optional)
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="12-digit Aadhar number"
                      />
                    </div>
                  </>
                )}
                {modalType === "beneficiary" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Beneficiary Name
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter full name as per bank account"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Number
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter bank account number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        IFSC Code
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter IFSC code (e.g., HDFC0001234)"
                      />
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Penny drop verification charge of
                        ₹2.5 + GST will be applied for verifying the bank
                        account.
                      </p>
                    </div>
                  </>
                )}
                {modalType === "transaction" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Beneficiary
                      </label>
                      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                        <option>Choose beneficiary</option>
                        {beneficiaries
                          .filter((b) => b.status === "ACTIVE")
                          .map((b) => (
                            <option
                              key={b.beneficiaryId}
                              value={b.beneficiaryId}
                            >
                              {b.name} - {b.account}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Sender
                      </label>
                      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                        <option>Choose sender</option>
                        {senders
                          .filter((s) => s.status === "Active")
                          .map((s) => (
                            <option key={s.senderId} value={s.senderId}>
                              {s.name} - {s.card}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter amount"
                        min="1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payout Type
                      </label>
                      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                        <option value="1">Instant Payout (IMPS)</option>
                        <option value="2">T+1 (Next Day Settlement)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Type
                      </label>
                      <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                        <option value="visa">Visa</option>
                        <option value="rupay">Rupay</option>
                        <option value="master">Mastercard</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Redirect URL
                      </label>
                      <input
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Additional Charge (Optional)
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Add extra charges on top to collect your commission
                      </p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Info:</strong> A collection URL will be
                        generated. Share this URL with your customer to complete
                        the payment.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                {modalType === "transaction"
                  ? "Generate Collection URL"
                  : `Create ${
                      modalType.charAt(0).toUpperCase() + modalType.slice(1)
                    }`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardPayout;
