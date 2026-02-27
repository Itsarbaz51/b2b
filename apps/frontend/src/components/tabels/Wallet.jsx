import { useEffect, useState, useMemo } from "react";
import {
  Users,
  Clock,
  Eye,
  Plus,
  Minus,
  ChevronLeft,
  ChevronRight,
  Download,
  TrendingUp,
  DollarSign,
  Check,
  X,
  Edit,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  getWalletTransactions,
  updateTopup,
} from "../../redux/slices/walletSlice";
import StateCard from "../ui/StateCard";
import ConfirmCard from "../ui/ConfirmCard";

const WalletTable = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Modal state
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState("");
  console.log(actionType);

  const dispatch = useDispatch();

  useEffect(() => {
    let trnType = "all";
    if (activeTab === "credit") trnType = "VERIFIED";
    if (activeTab === "pending") trnType = "PENDING";
    if (activeTab === "rejected") trnType = "REJECTED";
    dispatch(getWalletTransactions({ trnType }));
  }, [dispatch, activeTab]);

  const {
    transactions: transactionsData,
    loading,
    error,
  } = useSelector((state) => state.wallet);

  const formatTransactionForDisplay = (txn) => ({
    id: txn.id,
    amount: txn.amount,
    orderId: txn.orderId || "N/A",
    paymentId: txn.paymentId || "N/A",
    provider: txn.provider || "N/A",
    status: txn.status || "PENDING",
    paymentImage: txn.paymentImage,
    userId: txn.userId,
    createdAt: txn.createdAt ? new Date(txn.createdAt).toLocaleString() : "N/A",
    updatedAt: txn.updatedAt ? new Date(txn.updatedAt).toLocaleString() : "N/A",
    type: txn.status === "VERIFIED" ? "WALLET-CREDIT" : "PAYMENT",
    remark: `Payment ${txn.status?.toLowerCase()} for order ${txn.orderId}`,
  });

  const processedTransactions = useMemo(() => {
    if (!transactionsData) return [];
    return Array.isArray(transactionsData)
      ? transactionsData.map(formatTransactionForDisplay)
      : [formatTransactionForDisplay(transactionsData)];
  }, [transactionsData]);

  const filteredTransactions = processedTransactions.filter((txn) =>
    Object.values(txn).some((val) =>
      val?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const totalAmount = processedTransactions.reduce((s, t) => s + t.amount, 0);
  const verifiedTransactions = processedTransactions.filter(
    (t) => t.status === "VERIFIED"
  );
  const pendingTransactions = processedTransactions.filter(
    (t) => t.status === "PENDING"
  );

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "VERIFIED":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "REJECTED":
      case "FAILED":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "WALLET-CREDIT":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "PAYMENT":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-300";
    }
  };

  const handleAction = (txn, type) => {
    setSelectedTxn(txn);
    setActionType(type);
    setShowActionModal(true);
  };

  const confirmAction = () => {
    if (!selectedTxn) return;
    dispatch(updateTopup({ id: selectedTxn.id, status: actionType }));
    setShowActionModal(false);
  };

  const stats = [
    {
      name: "Total Amount",
      value: `₹${totalAmount.toLocaleString()}`,
      change: "+2.5%",
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      name: "Total Transactions",
      value: processedTransactions.length.toString(),
      change: "+12%",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Verified Payments",
      value: verifiedTransactions.length.toString(),
      change: "+8%",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Pending Payments",
      value: pendingTransactions.length.toString(),
      change: "-5%",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-center">
          <h2 className="text-2xl font-bold mb-2">
            Error Loading Transactions
          </h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <StateCard
            key={i}
            title={stat.name}
            value={stat.value}
            subText={stat.change}
            icon={stat.icon}
            iconBg={stat.bgColor}
            iconColor={stat.color}
          />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex space-x-3 overflow-x-auto">
        {[
          { id: "transactions", label: "All Transactions", icon: Clock },
          { id: "credit", label: "Verified", icon: Plus },
          { id: "pending", label: "Pending", icon: Clock },
          { id: "rejected", label: "Rejected", icon: Minus },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
              activeTab === tab.id
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex justify-between flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded-lg px-4 py-2 flex-1"
        />
        <button className="px-4 py-2 bg-green-500 text-white rounded-lg shadow">
          <Download className="h-4 w-4 inline mr-2" />
          Export
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-xl shadow-md">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-600 uppercase text-xs">
              {[
                "#",
                "Order ID",
                "Payment ID",
                "User ID",
                "Amount",
                "Status",
                "Type",
                "Created",
                "Actions",
              ].map((h) => (
                <th key={h} className="px-4 py-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length > 0 ? (
              paginatedTransactions.map((txn, i) => (
                <tr
                  key={txn.id}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3">{startIndex + i + 1}</td>
                  <td className="px-4 py-3">{txn.orderId}</td>
                  <td className="px-4 py-3">{txn.paymentId}</td>
                  <td className="px-4 py-3">{txn.userId}</td>
                  <td className="px-4 py-3 font-semibold">
                    ₹{txn.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                        txn.status
                      )}`}
                    >
                      {txn.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getTypeColor(
                        txn.type
                      )}`}
                    >
                      {txn.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">{txn.createdAt}</td>
                  <td className="px-4 py-3 space-x-2">
                    {txn.paymentImage && (
                      <button
                        onClick={() => window.open(txn.paymentImage, "_blank")}
                        className="text-blue-600 hover:underline"
                      >
                        <Eye className="h-4 w-4 inline" />
                      </button>
                    )}
                    <button
                      onClick={() => handleAction(txn, "VERIFIED")}
                      className="text-green-600 hover:underline"
                    >
                      <Check className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => handleAction(txn, "REJECTED")}
                      className="text-red-600 hover:underline"
                    >
                      <X className="h-4 w-4 inline" />
                    </button>
                    <button
                      onClick={() => console.log("Edit", txn)}
                      className="text-gray-600 hover:underline"
                    >
                      <Edit className="h-4 w-4 inline" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center py-6 text-gray-500">
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1}-
          {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of{" "}
          {filteredTransactions.length}
        </p>
        <div className="flex space-x-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded ${
                currentPage === i + 1 ? "bg-blue-600 text-white" : ""
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <ConfirmCard
          actionType={actionType}
          isClose={() => setShowActionModal(false)}
          isSubmit={confirmAction}
        />
      )}
    </div>
  );
};

export default WalletTable;
