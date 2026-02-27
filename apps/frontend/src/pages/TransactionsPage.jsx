import { useState } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Activity,
  Smartphone,
  ArrowRightLeft,
  Send,
  CreditCard,
  Receipt,
  Zap,
  Building,
  Wallet,
  DollarSign,
  FileText,
  TrendingUp,
  Download,
  Eye,
} from "lucide-react";

// Sample pending transactions data
const mockPendingTransactions = [
  {
    id: 1,
    type: "Recharge",
    userId: "CSP5380225",
    userName: "Durgesh Singh",
    amount: 299,
    operator: "Airtel",
    mobile: "9876543210",
    status: "Pending",
    date: "2024-09-25 10:30 AM",
    transactionId: "RCH001234567",
  },
  {
    id: 2,
    type: "Qtransfer",
    userId: "CSP5263378",
    userName: "Rahul pandey",
    amount: 5000,
    beneficiary: "Manish Kumar",
    status: "Processing",
    date: "2024-09-25 09:15 AM",
    transactionId: "QTR001234568",
  },
  {
    id: 3,
    type: "Payout",
    userId: "CSP1422436",
    userName: "Manish jha",
    amount: 2500,
    beneficiary: "State Bank of India",
    accountNo: "****1234",
    status: "Pending",
    date: "2024-09-25 08:45 AM",
    transactionId: "PAY001234569",
  },
  {
    id: 4,
    type: "DMT",
    userId: "CSP858893",
    userName: "Durgesh Singh",
    amount: 15000,
    beneficiary: "Priya Sharma",
    status: "Processing",
    date: "2024-09-24 06:20 PM",
    transactionId: "DMT001234570",
  },
  {
    id: 5,
    type: "BBPS",
    userId: "CSP4860379",
    userName: "Arbaz khan",
    amount: 1200,
    biller: "Electricity Board",
    consumerNo: "123456789",
    status: "Pending",
    date: "2024-09-24 03:30 PM",
    transactionId: "BBP001234571",
  },
];

// Sample regular transactions data
const mockTransactions = [
  {
    id: 1,
    type: "BBPS",
    userId: "CSP5380225",
    userName: "Durgesh Singh",
    amount: 850,
    biller: "Gas Connection",
    status: "Success",
    commission: 25.5,
    date: "2024-09-24 02:15 PM",
    transactionId: "BBP001234572",
  },
  {
    id: 2,
    type: "PAN Txns",
    userId: "CSP5263378",
    userName: "Rahul pandey",
    amount: 107,
    panName: "AMIT KUMAR",
    status: "Success",
    commission: 15.0,
    date: "2024-09-24 01:45 PM",
    transactionId: "PAN001234573",
  },
  {
    id: 3,
    type: "Payout",
    userId: "CSP1422436",
    userName: "Manish jha",
    amount: 7500,
    beneficiary: "HDFC Bank",
    status: "Success",
    commission: 5.0,
    date: "2024-09-24 12:30 PM",
    transactionId: "PAY001234574",
  },
  {
    id: 4,
    type: "AEPS Txn",
    userId: "CSP858893",
    userName: "Durgesh Singh",
    amount: 2000,
    transactionType: "Cash Withdrawal",
    status: "Success",
    commission: 40.0,
    date: "2024-09-24 11:20 AM",
    transactionId: "AEP001234575",
  },
  {
    id: 5,
    type: "Qtransfer Txn",
    userId: "CSP4860379",
    userName: "Arbaz khan",
    amount: 3500,
    beneficiary: "Ravi Singh",
    status: "Success",
    commission: 0.0,
    date: "2024-09-24 10:15 AM",
    transactionId: "QTR001234576",
  },
  {
    id: 6,
    type: "Recharge",
    userId: "CSP9619910",
    userName: "samir khan",
    amount: 199,
    operator: "Jio",
    status: "Success",
    commission: 5.97,
    date: "2024-09-24 09:45 AM",
    transactionId: "RCH001234577",
  },
  {
    id: 7,
    type: "DMT",
    userId: "CSP5380225",
    userName: "Durgesh Singh",
    amount: 25000,
    beneficiary: "Sunita Devi",
    status: "Success",
    commission: 12.5,
    date: "2024-09-24 08:30 AM",
    transactionId: "DMT001234578",
  },
  {
    id: 8,
    type: "E-Wallet Txns",
    userId: "CSP5263378",
    userName: "Rahul pandey",
    amount: 500,
    transactionType: "Credit",
    status: "Success",
    commission: 0.0,
    date: "2024-09-24 07:15 AM",
    transactionId: "EWT001234579",
  },
  {
    id: 9,
    type: "AEPS Wallet Txns",
    userId: "CSP1422436",
    userName: "Manish jha",
    amount: 1000,
    transactionType: "Debit",
    status: "Success",
    commission: 0.0,
    date: "2024-09-24 06:45 AM",
    transactionId: "AWL001234580",
  },
  {
    id: 10,
    type: "All Commissions",
    userId: "CSP858893",
    userName: "Durgesh Singh",
    amount: 156.5,
    source: "Mixed Transactions",
    status: "Credited",
    commission: 156.5,
    date: "2024-09-24 06:00 AM",
    transactionId: "COM001234581",
  },
];

const TransactionsPage = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("today");
  const itemsPerPage = 10;

  // Get icon for transaction type
  const getTypeIcon = (type) => {
    const iconMap = {
      Recharge: Smartphone,
      Qtransfer: ArrowRightLeft,
      "Qtransfer Txn": ArrowRightLeft,
      Payout: Send,
      DMT: CreditCard,
      BBPS: Zap,
      "PAN Txns": FileText,
      "AEPS Txn": Receipt,
      "E-Wallet Txns": Wallet,
      "AEPS Wallet Txns": Building,
      "All Commissions": TrendingUp,
    };
    return iconMap[type] || Activity;
  };

  // Get color for status
  const getStatusColor = (status) => {
    switch (status) {
      case "Success":
      case "Credited":
        return "bg-green-100 text-green-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Processing":
        return "bg-blue-100 text-blue-800";
      case "Failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Filter data based on active tab and category
  const getFilteredData = () => {
    let data =
      activeTab === "pending" ? mockPendingTransactions : mockTransactions;

    if (selectedCategory !== "all") {
      data = data.filter((item) => item.type === selectedCategory);
    }

    if (searchTerm) {
      data = data.filter(
        (item) =>
          item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return data;
  };

  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Categories for pending transactions
  const pendingCategories = [
    { id: "all", label: "All Pending", icon: Clock },
    { id: "Recharge", label: "Recharge", icon: Smartphone },
    { id: "Qtransfer", label: "Qtransfer", icon: ArrowRightLeft },
    { id: "Payout", label: "Payout", icon: Send },
    { id: "DMT", label: "DMT", icon: CreditCard },
    { id: "BBPS", label: "BBPS", icon: Zap },
  ];

  // Categories for regular transactions
  const transactionCategories = [
    { id: "all", label: "All Transactions", icon: Activity },
    { id: "BBPS", label: "BBPS", icon: Zap },
    { id: "PAN Txns", label: "PAN Txns", icon: FileText },
    { id: "Payout", label: "Payout", icon: Send },
    { id: "AEPS Txn", label: "AEPS Txn", icon: Receipt },
    { id: "Qtransfer Txn", label: "Qtransfer", icon: ArrowRightLeft },
    { id: "Recharge", label: "Recharge", icon: Smartphone },
    { id: "DMT", label: "DMT", icon: CreditCard },
    { id: "E-Wallet Txns", label: "E-Wallet", icon: Wallet },
    { id: "AEPS Wallet Txns", label: "AEPS Wallet", icon: Building },
    { id: "All Commissions", label: "Commissions", icon: TrendingUp },
  ];

  const currentCategories =
    activeTab === "pending" ? pendingCategories : transactionCategories;

  const handleAction = (action, transactionId) => {
    alert(
      `${action.toUpperCase()} action for Transaction ID: ${transactionId}`
    );
  };

  return (
    <div className="">
      <div className="">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            Transaction Management
          </h1>
          <p className="text-gray-600">
            Monitor and manage all pending and completed transactions
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {mockPendingTransactions.length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {
                    mockTransactions.filter((t) => t.status === "Success")
                      .length
                  }
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Volume</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹
                  {mockTransactions
                    .reduce((sum, t) => sum + t.amount, 0)
                    .toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Commission</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹
                  {mockTransactions
                    .reduce((sum, t) => sum + (t.commission || 0), 0)
                    .toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Main Tab Navigation */}
        <div className="mb-6 w-fit">
          <div className="border-b border-gray-200 bg-white rounded-t-xl shadow-sm">
            <nav className="-mb-px flex">
              <button
                onClick={() => {
                  setActiveTab("pending");
                  setSelectedCategory("all");
                  setCurrentPage(1);
                  setSearchTerm("");
                }}
                className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === "pending"
                    ? "border-orange-500 text-orange-600 bg-orange-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Clock className="w-5 h-5" />
                <span>Pending Transactions</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab("transactions");
                  setSelectedCategory("all");
                  setCurrentPage(1);
                  setSearchTerm("");
                }}
                className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === "transactions"
                    ? "border-blue-500 text-blue-600 bg-blue-50"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <Activity className="w-5 h-5" />
                <span>Transactions</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div className="mb-6 w-fit">
          <div className="flex flex-wrap gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
            {currentCategories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    selectedCategory === category.id
                      ? activeTab === "pending"
                        ? "bg-orange-100 text-orange-800 border border-orange-200"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user, transaction ID, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button className="flex items-center px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "#",
                    "Transaction ID",
                    "Type",
                    "User Details",
                    "Amount",
                    "Details",
                    "Status",
                    activeTab === "transactions" && "Commission",
                    "Date",
                    "Action",
                  ]
                    .filter(Boolean)
                    .map((header) => (
                      <th
                        key={header}
                        className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeTab === "transactions" ? 10 : 9}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No transactions found</p>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((transaction, index) => {
                    const Icon = getTypeIcon(transaction.type);
                    return (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {startIndex + index + 1}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-mono text-xs">
                          {transaction.transactionId}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <Icon className="w-4 h-4 text-gray-600" />
                            <span className="font-medium text-gray-900">
                              {transaction.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                          <div>
                            <div className="font-medium text-gray-900">
                              {transaction.userName}
                            </div>
                            <div className="text-gray-500 text-xs">
                              {transaction.userId}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                          ₹{transaction.amount}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600 max-w-xs">
                          {transaction.operator && (
                            <div>Operator: {transaction.operator}</div>
                          )}
                          {transaction.mobile && (
                            <div>Mobile: {transaction.mobile}</div>
                          )}
                          {transaction.beneficiary && (
                            <div>To: {transaction.beneficiary}</div>
                          )}
                          {transaction.biller && (
                            <div>Biller: {transaction.biller}</div>
                          )}
                          {transaction.panName && (
                            <div>PAN: {transaction.panName}</div>
                          )}
                          {transaction.transactionType && (
                            <div>Type: {transaction.transactionType}</div>
                          )}
                          {transaction.source && (
                            <div>Source: {transaction.source}</div>
                          )}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                              transaction.status
                            )}`}
                          >
                            {transaction.status}
                          </span>
                        </td>
                        {activeTab === "transactions" && (
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                            <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              ₹{transaction.commission || 0}
                            </span>
                          </td>
                        )}
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {transaction.date}
                        </td>
                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() =>
                                handleAction("view", transaction.transactionId)
                              }
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {activeTab === "pending" && (
                              <>
                                <button
                                  onClick={() =>
                                    handleAction(
                                      "approve",
                                      transaction.transactionId
                                    )
                                  }
                                  className="text-green-600 hover:text-green-800 transition-colors"
                                  title="Approve"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() =>
                                    handleAction(
                                      "reject",
                                      transaction.transactionId
                                    )
                                  }
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                  title="Reject"
                                >
                                  ✕
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {paginatedData.length > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <span className="text-sm text-gray-600">
              Showing {startIndex + 1}–{startIndex + paginatedData.length} of{" "}
              {filteredData.length} transactions
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              <span className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg">
                {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
