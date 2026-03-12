import React, { Fragment, useState } from "react";
import {
  Search,
  Clock,
  Activity,
  Receipt,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import { paisaToRupee } from "../../utils/lib";
import { useSelector } from "react-redux";
import { ObjectInspector } from "react-inspector";

const HIDE_KEYS = ["photo_link", "xml_file", "base64"];

const formatKey = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const calcLatency = (start, end) => {
  if (!start || !end) return "N/A";
  const diff = new Date(end).getTime() - new Date(start).getTime();
  return diff >= 0 ? `${diff} ms` : "N/A";
};

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
  const [expandedTxn, setExpandedTxn] = useState(null);

  const user = useSelector((s) => s.auth?.currentUser);
  const isAdmin = user?.role?.name === "ADMIN";

  const copyJSON = async (obj) => {
    await navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
  };

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
                setActiveTab("transactions");
                setSelectedCategory("all");
              }}
              className={`flex items-center space-x-2 py-4 px-6 border-b-2 text-sm ${
                activeTab === "transactions"
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-gray-500"
              }`}
            >
              <Activity className="w-5 h-5" />
              Transactions
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {[
                "#",
                "Txn ID",
                "Service",
                "User",
                "Amount",
                "Status",
                "Date",
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

              const response =
                txn.providerResponse?.data &&
                typeof txn.providerResponse.data === "object"
                  ? txn.providerResponse.data
                  : txn.providerResponse || {};

              const latency = calcLatency(
                txn.initiatedAt,
                txn.completedAt || txn.processedAt,
              );

              const providerStatus =
                txn.providerResponse?.status || response?.status || txn.status;

              return (
                <Fragment key={txn.id}>
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4">{startIndex + index + 1}</td>

                    <td className="px-6 py-4 text-blue-600 font-mono text-xs">
                      {txn.txnId}
                    </td>

                    <td className="px-6 py-4 flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {service?.name}
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

                    <td className="px-6 py-4">
                      <ProviderStatusBadge status={providerStatus} />
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {new Date(txn.initiatedAt).toLocaleString()}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() =>
                          setExpandedTxn(expandedTxn === index ? null : index)
                        }
                      >
                        {expandedTxn === index ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Panel */}
                  {expandedTxn === index && isAdmin && (
                    <tr className="bg-gray-50">
                      <td colSpan="8" className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Pricing */}
                          {txn.pricing && (
                            <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
                              <h3 className="font-semibold mb-4">Pricing</h3>

                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span>Total</span>
                                  <span>₹{txn.pricing.total}</span>
                                </div>

                                <div className="flex justify-between">
                                  <span>Surcharge</span>
                                  <span>₹{txn.pricing.surcharge}</span>
                                </div>

                                <div className="flex justify-between">
                                  <span>Provider Cost</span>
                                  <span>₹{txn.pricing.providerCost}</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Provider Info */}
                          <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
                            <h3 className="font-semibold mb-4">
                              Provider Info
                            </h3>

                            <div className="text-sm space-y-2">
                              <div>
                                <div className="text-xs text-gray-500">
                                  Reference
                                </div>
                                {txn.providerReference}
                              </div>

                              <div>
                                <div className="text-xs text-gray-500">
                                  Idempotency
                                </div>
                                <div className="break-all text-xs font-mono">
                                  {txn.idempotencyKey}
                                </div>
                              </div>

                              <div>
                                <div className="text-xs text-gray-500">
                                  Latency
                                </div>
                                <span className="text-green-600 font-semibold">
                                  {latency}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* API Response */}
                        <div className="bg-white border border-gray-300 rounded-xl p-5 shadow-sm">
                          <h3 className="font-semibold mb-4">API Response</h3>

                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-sm">
                            {Object.entries(response)
                              .filter(
                                ([k, v]) =>
                                  !HIDE_KEYS.includes(k) &&
                                  v !== null &&
                                  v !== "",
                              )
                              .map(([key, value]) => {
                                if (typeof value === "object") {
                                  return (
                                    <div
                                      key={key}
                                      className="col-span-2 md:col-span-3 border border-gray-300 rounded-lg p-3 bg-gray-50"
                                    >
                                      <div className="font-medium mb-2">
                                        {formatKey(key)}
                                      </div>

                                      <div className="grid grid-cols-3 gap-x-4 gap-y-1 text-xs">
                                        {Object.entries(value).map(([k, v]) => (
                                          <div
                                            key={k}
                                            className="flex justify-between"
                                          >
                                            <span className="text-gray-500">
                                              {formatKey(k)}
                                            </span>

                                            <span className="font-medium">
                                              {String(v)}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                }

                                return (
                                  <div
                                    key={key}
                                    className="flex justify-between items-start border-b border-gray-100 py-2"
                                  >
                                    <span className="text-gray-500">
                                      {formatKey(key)}
                                    </span>

                                    <span className="break-words text-right max-w-[220px]">
                                      {String(value)}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>

                        {/* JSON Viewer */}
                        <details className="mt-6">
                          <summary className="cursor-pointer text-blue-600 text-sm font-semibold">
                            View Raw JSON
                          </summary>

                          <div className="relative mt-3 rounded-lg p-4 max-h-96 overflow-auto">
                            <button
                              onClick={() => copyJSON(txn.providerResponse)}
                              className="absolute top-2 right-2 flex items-center gap-1 text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded"
                            >
                              <Copy size={14} /> Copy
                            </button>

                            <ObjectInspector
                              data={txn.providerResponse}
                              expandLevel={2}
                            />
                          </div>
                        </details>
                      </td>
                    </tr>
                  )}
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
