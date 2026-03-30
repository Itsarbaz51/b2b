import { Fragment } from "react";
import { Search, Activity, RefreshCw } from "lucide-react";
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

  return (
    <span
      className={`px-2 py-1 text-xs rounded-full ${map[s] || "bg-gray-100"}`}
    >
      {s || "UNKNOWN"}
    </span>
  );
};

const ReportTable = ({
  reports = null,
  categories,
  activeType,
  setSelectedCategory,
  searchTerm,
  setSearchTerm,
  dateFilter,
  setDateFilter,
  startIndex,
  onRefresh,
  loading,
}) => {
  // 🔥 normalize rows based on type
  const getRows = () => {
    if (!reports) return [];

    if (activeType === "all") {
      return [
        ...(reports.profit || []),
        ...(reports.gst || []),
        ...(reports.tds || []),
      ];
    }

    return Array.isArray(reports) ? reports : [];
  };

  const rows = getRows();

  // 🔥 detect type helpers
  const isService = activeType === "service";
  const isUser = activeType === "user";
  const isGST = activeType === "gst";

  return (
    <>
      {/* Category Chips */}
      <div className="flex flex-wrap gap-2 bg-white p-3 rounded-t-xl border-t border-gray-200">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              activeType === cat.id.toLowerCase()
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 bg-white p-4 rounded-b-xl border-b border-gray-200 shadow-sm">
        {/* 🔍 Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border rounded-lg border-gray-300"
          />
        </div>

        {/* 📅 Date Range */}
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateFilter?.from || ""}
            onChange={(e) =>
              setDateFilter((prev) => ({ ...prev, from: e.target.value }))
            }
            className="px-3 py-2 border rounded-lg border-gray-300"
          />

          <span className="text-gray-500">to</span>

          <input
            type="date"
            value={dateFilter?.to || ""}
            onChange={(e) =>
              setDateFilter((prev) => ({ ...prev, to: e.target.value }))
            }
            className="px-3 py-2 border rounded-lg border-gray-300"
          />
        </div>
        <button
          onClick={() => {
            setSearchTerm("");
            setDateFilter({ from: "", to: "" });
          }}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Clear
        </button>

        {/* 🔄 Refresh */}
        <button
          onClick={onRefresh}
          className="flex items-center px-4 py-2 border rounded-lg border-gray-300"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th>#</th>

              {isService ? (
                <>
                  <th>Txn</th>
                  <th>Service</th>
                  <th>Provider</th>
                  <th>Amount</th>
                  <th>Total Txn</th>
                </>
              ) : isUser ? (
                <>
                  <th>Name</th>
                  <th>Balance</th>
                  <th>Profit</th>
                </>
              ) : isGST ? (
                <>
                  <th>Txn ID</th>
                  <th>User</th>
                  <th>GST Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </>
              ) : (
                // 🔥 PROFIT / TDS
                <>
                  <th>Txn ID</th>
                  <th>User</th>
                  <th>Amount</th>
                  <th>Commission</th>
                  <th>Net Profit</th>
                  <th>Status</th>
                  <th>Date</th>
                </>
              )}
            </tr>
          </thead>

          <tbody className="divide-y">
            {rows.map((item, index) => {
              const txn = item.transaction || item;

              return (
                <Fragment key={item.id || index}>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4">{startIndex + index + 1}</td>

                    {/* 🔥 SERVICE TYPE */}
                    {isService && (
                      <>
                        <td className="px-6 py-4">-</td>
                        <td className="px-6 py-4">{item.service}</td>
                        <td className="px-6 py-4">{item.provider}</td>
                        <td className="px-6 py-4 font-semibold">
                          ₹{paisaToRupee(item.totalAmount || 0)}
                        </td>
                        <td className="px-6 py-4">-</td>
                        <td className="px-6 py-4">-</td>
                        <td className="px-6 py-4">{item.totalTxn}</td>
                        <td className="px-6 py-4">-</td>
                        <td className="px-6 py-4">-</td>
                      </>
                    )}

                    {/* 🔥 USER TYPE */}
                    {isUser && (
                      <>
                        <td className="px-6 py-4">-</td>
                        <td className="px-6 py-4">{item.name}</td>
                        <td className="px-6 py-4">
                          ₹{paisaToRupee(item.totalBalance)}
                        </td>
                        <td className="px-6 py-4">-</td>
                        <td className="px-6 py-4">-</td>
                        <td className="px-6 py-4">
                          ₹{paisaToRupee(item.totalProfit)}
                        </td>
                        <td className="px-6 py-4">-</td>
                        <td className="px-6 py-4">-</td>
                      </>
                    )}

                    {/* 🔥 NORMAL (PROFIT / GST / TDS) */}
                    {/* 🔥 NORMAL TYPES */}
                    {!isService && !isUser && (
                      <>
                        {/* GST TYPE */}
                        {isGST ? (
                          <>
                            <td className="px-6 py-4 text-blue-600 text-xs">
                              {item.transactionId}
                            </td>

                            <td className="px-6 py-4">
                              {item.createdByUser?.firstName}{" "}
                              {item.createdByUser?.lastName}
                            </td>

                            <td className="px-6 py-4 font-semibold">
                              ₹{paisaToRupee(item.amount || 0)}
                            </td>

                            <td className="px-6 py-4">
                              <ProviderStatusBadge status="SUCCESS" />
                            </td>

                            <td className="px-6 py-4 text-sm">
                              {new Date(item.createdAt).toLocaleString()}
                            </td>
                          </>
                        ) : (
                          // 🔥 PROFIT / TDS
                          <>
                            <td className="px-6 py-4 text-blue-600 text-xs">
                              {txn.txnId || item.transactionId}
                            </td>

                            <td className="px-6 py-4">
                              {item.user?.firstName} {item.user?.lastName}
                            </td>

                            <td className="px-6 py-4 font-semibold">
                              ₹{paisaToRupee(item.amount || 0)}
                            </td>

                            {/* Commission */}
                            <td className="px-6 py-4">
                              ₹
                              {paisaToRupee(
                                item.surchargeAmount ||
                                  item.commissionAmount ||
                                  0,
                              )}
                            </td>

                            {/* Net Profit */}
                            <td className="px-6 py-4 font-semibold text-green-600">
                              ₹{paisaToRupee(item.netAmount || 0)}
                            </td>

                            <td className="px-6 py-4">
                              <ProviderStatusBadge status={txn.status} />
                            </td>

                            <td className="px-6 py-4 text-sm">
                              {new Date(
                                item.createdAt || txn.completedAt,
                              ).toLocaleString()}
                            </td>
                          </>
                        )}
                      </>
                    )}
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

export default ReportTable;
