import { Fragment } from "react";
import { Search, Clock, Activity, RefreshCw } from "lucide-react";
import { paisaToRupee } from "../../utils/lib";

const ProviderStatusBadge = ({ status }) => {
  const s = String(status || "").toUpperCase();

  const map = {
    SUCCESS: "bg-green-100 text-green-700",
    VALID: "bg-green-100 text-green-700",
    VERIFIED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    FAILED: "bg-red-100 text-red-700",
    INVALID: "bg-red-100 text-red-700",
  };

  const cls = map[s] || "bg-gray-100 text-gray-700";

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${cls}`}>
      {s || "UNKNOWN"}
    </span>
  );
};

const TransactionsTable = ({
  transactions = [],
  categories,
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
  onRefresh,
  loading,
}) => {
  return (
    <>
      {/* Tabs */}
      <div className="mb-6 w-fit">
        <div className="border-b border-gray-200 bg-white rounded-t-xl shadow-sm">
          <nav className="flex gap-2 p-2">
            <button
              onClick={() => {
                setActiveTab("pending");
                setSelectedCategory("all");
              }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === "pending"
                  ? "bg-orange-100 text-orange-700"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <Clock className="w-5 h-5" />
              Pending Transactions
            </button>

            <button
              onClick={() => {
                setActiveTab("success");
                setSelectedCategory("all");
              }}
              className={`flex items-center space-x-2 py-4 px-6 border-b-2 text-sm ${
                activeTab === "success"
                  ? "border-green-500 text-green-600 bg-blue-50"
                  : "border-transparent text-gray-500"
              }`}
            >
              <Activity className="w-5 h-5" />
              Success Transactions
            </button>
            <button
              onClick={() => {
                setActiveTab("failed");
                setSelectedCategory("all");
              }}
              className={`flex items-center space-x-2 py-4 px-6 border-b-2 text-sm ${
                activeTab === "failed"
                  ? "border-red-500 text-red-600 bg-blue-50"
                  : "border-transparent text-gray-500"
              }`}
            >
              <Activity className="w-5 h-5" />
              Failed Transactions
            </button>
          </nav>
        </div>
      </div>

      {/* Category Chips */}
      <div className="mb-6 flex flex-wrap gap-2 bg-white p-3 rounded-xl border border-gray-200">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              selectedCategory === cat.id
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <input
            type="text"
            placeholder="Search txnId, user phoneNumber, firstName lastname transaction..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 outline-none"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl"
          >
            <option value="all">All Days</option>
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <button
            onClick={onRefresh}
            className="flex items-center px-4 py-3 border border-gray-200 rounded-xl"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {[
                "#",
                "Txn ID",
                "Service",
                "User",
                "Txn Amount",
                "GST",
                "Surcharge",
                "Total Amount",
                "Status",
                "Init Date",
                "Completed Date",
                "Details",
              ].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y">
            {transactions.map((txn, index) => {
              const service = txn.serviceProviderMapping?.service;
              const Icon = getTypeIcon(service?.code);

              return (
                <Fragment key={txn.id}>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">{startIndex + index + 1}</td>

                    <td className="px-6 py-4 text-blue-600 font-mono text-xs">
                      {txn.txnId}
                    </td>

                    <td className="px-6 py-4 flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {txn?.apiEntity?.requestPayload?.type && service?.name
                        ? `${txn?.apiEntity?.requestPayload.type} - ${service?.name}`
                        : txn?.apiEntity?.requestPayload?.type || service?.name}
                    </td>

                    <td className="px-6 py-4">
                      {txn.user?.firstName} {txn.user?.lastName}
                      <div className="text-xs text-gray-500">
                        {txn.user?.phoneNumber}
                      </div>
                    </td>

                    <td className="px-6 py-4 font-semibold">
                      ₹{paisaToRupee(txn.amount)}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      ₹
                      {paisaToRupee(
                        Number(txn.pricing?.gstSurcharge) +
                          Number(txn.pricing?.gstProvider),
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      ₹{paisaToRupee(txn.pricing?.surcharge)}
                    </td>
                    <td className="px-6 py-4 font-semibold">
                      ₹{paisaToRupee(txn.pricing?.totalDebit || txn.pricing?.netCredit)}
                    </td>

                    <td className="px-6 py-4">
                      <ProviderStatusBadge status={txn.status} />
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {new Date(txn.initiatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(txn.completedAt).toLocaleString()}
                    </td>
                  </tr>
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TransactionsTable;
