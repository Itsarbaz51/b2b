import { Search, Clock, Activity, Download, Eye, Receipt } from "lucide-react";

const TransactionsTable = ({
  transactions = [],
  categories = [],
  activeTab,
  setActiveTab,
  selectedCategory,
  setSelectedCategory,
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  startIndex,
  getTypeIcon,
  getStatusColor,
  handleAction,
}) => {
  return (
    <>
      {/* Main Tab Navigation */}
      <div className="mb-6 w-fit">
        <div className="border-b border-gray-200 bg-white rounded-t-xl shadow-sm">
          <nav className="-mb-px flex">
            <button
              onClick={() => {
                setActiveTab("pending");
                setSelectedCategory("all");
              }}
              className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === "pending"
                  ? "border-orange-500 text-orange-600 bg-orange-50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>Pending Transactions</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("transactions");
                setSelectedCategory("all");
              }}
              className={`flex items-center space-x-2 py-4 px-6 border-b-2 font-medium text-sm ${
                activeTab === "transactions"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Activity className="w-5 h-5" />
              <span>Transactions</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Category Chips */}
      <div className="mb-6 w-fit">
        <div className="flex flex-wrap gap-2 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  selectedCategory === category.id
                    ? "bg-blue-100 text-blue-800 border border-blue-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <input
            type="text"
            placeholder="Search by user, transaction ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl bg-white shadow-sm"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <button className="flex items-center px-4 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm">
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
                      className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {header}
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-100">
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan={activeTab === "transactions" ? 10 : 9}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((txn, index) => {
                  const Icon = getTypeIcon(txn.type);

                  return (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm font-medium">
                        {startIndex + index + 1}
                      </td>

                      <td className="px-4 py-4 text-blue-600 font-mono text-xs">
                        {txn.transactionId}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-gray-600" />
                          {txn.type}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium">{txn.userName}</div>
                          <div className="text-xs text-gray-500">
                            {txn.userId}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 font-semibold">₹{txn.amount}</td>

                      <td className="px-4 py-4 text-gray-600">
                        {txn.operator && <div>Operator: {txn.operator}</div>}
                        {txn.mobile && <div>Mobile: {txn.mobile}</div>}
                        {txn.beneficiary && <div>To: {txn.beneficiary}</div>}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                            txn.status,
                          )}`}
                        >
                          {txn.status}
                        </span>
                      </td>

                      {activeTab === "transactions" && (
                        <td className="px-4 py-4">₹{txn.commission || 0}</td>
                      )}

                      <td className="px-4 py-4">{txn.date}</td>

                      <td className="px-4 py-4">
                        <button
                          onClick={() =>
                            handleAction("view", txn.transactionId)
                          }
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default TransactionsTable;
