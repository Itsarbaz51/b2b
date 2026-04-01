import React, { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getLedger, clearLedger } from "../redux/slices/ledgerSlice";
import {
  Filter,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Wallet,
} from "lucide-react";
import { paisaToRupee } from "../utils/lib";
import RefreshToast from "../components/ui/RefreshToast";

const Ledger = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.ledger);
  const ledgerData = useSelector((state) => state.ledger);
  const [filters, setFilters] = useState({
    transactionId: "",
    startDate: "",
    endDate: "",
    type: "",
    page: 1,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

  useEffect(() => {
    fetchLedger();
    return () => {
      dispatch(clearLedger());
    };
  }, [filters.page, filters.limit]);

  const fetchLedger = useCallback(() => {
    const queryParams = {};
    if (filters.transactionId)
      queryParams.transactionId = filters.transactionId;
    if (filters.startDate) queryParams.startDate = filters.startDate;
    if (filters.endDate) queryParams.endDate = filters.endDate;
    if (filters.type) queryParams.type = filters.type;
    queryParams.page = filters.page;
    queryParams.limit = filters.limit;

    dispatch(getLedger(queryParams));
  }, [dispatch, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const applyFilters = () => {
    fetchLedger();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({
      transactionId: "",
      startDate: "",
      endDate: "",
      type: "",
      page: 1,
      limit: 20,
    });
    setShowFilters(false);
    setTimeout(() => fetchLedger(), 0);
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getEntryTypeBadge = (type) => {
    if (type === "CREDIT") {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <TrendingUp className="w-3 h-3 mr-1" />
          Credit
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        <TrendingDown className="w-3 h-3 mr-1" />
        Debit
      </span>
    );
  };

  const getReferenceTypeColor = (type) => {
    const colors = {
      PROVIDER_GST: "bg-purple-100 text-purple-800",
      USER_GST: "bg-indigo-100 text-indigo-800",
      PROVIDER_COST: "bg-orange-100 text-orange-800",
      SURCHARGE: "bg-yellow-100 text-yellow-800",
      FUND_REQUEST: "bg-blue-100 text-blue-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (loading && !ledgerData?.data?.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ledger entries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-red-50 p-8 rounded-lg max-w-md">
          <div className="text-red-600 text-5xl mb-4">!</div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Ledger
          </h3>
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchLedger}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const entries = ledgerData?.data || [];
  const pagination = ledgerData?.pagination || {};

  return (
    <div className="min-h-screen ">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-4  py-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Ledger Entries
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                View and manage all financial transactions
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {Object.values(filters).some(
                  (v) => v && v !== 1 && v !== 20,
                ) && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Active
                  </span>
                )}
              </button>

              <RefreshToast isLoading={loading} onClick={fetchLedger} />
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction ID
                  </label>
                  <input
                    type="text"
                    value={filters.transactionId}
                    onChange={(e) =>
                      handleFilterChange("transactionId", e.target.value)
                    }
                    placeholder="Search by transaction ID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entry Type
                  </label>
                  <select
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="CREDIT">Credit</option>
                    <option value="DEBIT">Debit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) =>
                      handleFilterChange("startDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) =>
                      handleFilterChange("endDate", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Clear All
                </button>
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-sm text-gray-600">Total Transactions</p>
            <p className="text-2xl font-bold text-gray-900">
              {pagination.total || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-sm text-gray-600">Total Credit</p>
            <p className="text-2xl font-bold text-green-600">
              {paisaToRupee(
                entries
                  .filter((e) => e.entryType === "CREDIT")
                  .reduce((sum, e) => sum + parseFloat(e.amount), 0),
              )}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
            <p className="text-sm text-gray-600">Total Debit</p>
            <p className="text-2xl font-bold text-red-600">
              {paisaToRupee(
                entries
                  .filter((e) => e.entryType === "DEBIT")
                  .reduce((sum, e) => sum + parseFloat(e.amount), 0),
              )}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th> */}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(entry.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">
                      {entry.transaction?.txnId || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getEntryTypeBadge(entry.entryType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getReferenceTypeColor(entry.referenceType)}`}
                      >
                        {entry.referenceType.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`text-sm font-semibold ${entry.entryType === "CREDIT" ? "text-green-600" : "text-red-600"}`}
                      >
                        {entry.entryType === "CREDIT" ? "+" : "-"}
                        {paisaToRupee(entry.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {paisaToRupee(entry.runningBalance)}
                    </td>
                    {/* FROM (kisne diya) */}
                    {/* <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {entry.createdByUser?.username || "SYSTEM"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.createdByUser?.role?.name}
                      </div>
                    </td> */}

                    {/* TO (kisko mila) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {entry.wallet?.user?.username}
                      </div>
                      <div className="text-xs text-gray-500">
                        {entry.wallet?.user?.role?.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="text-blue-600 hover:text-blue-900 transition"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {entries.length === 0 && !loading && (
            <div className="text-center py-12">
              <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No entries found
              </h3>
              <p className="text-gray-500">
                Try adjusting your filters or refresh the page
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing{" "}
                      <span className="font-medium">
                        {(pagination.page - 1) * pagination.limit + 1}
                      </span>{" "}
                      to{" "}
                      <span className="font-medium">
                        {Math.min(
                          pagination.page * pagination.limit,
                          pagination.total,
                        )}
                      </span>{" "}
                      of <span className="font-medium">{pagination.total}</span>{" "}
                      results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      {[...Array(Math.min(5, pagination.totalPages))].map(
                        (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (
                            pagination.page >=
                            pagination.totalPages - 2
                          ) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                pagination.page === pageNum
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                  : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        },
                      )}
                      <button
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page === pagination.totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for Entry Details */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Transaction Details
              </h3>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    Transaction ID
                  </label>
                  <p className="text-sm font-mono text-gray-900">
                    {selectedEntry.transaction?.txnId || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    Status
                  </label>
                  <p className="text-sm font-medium text-green-600">
                    {selectedEntry.transaction?.status || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    Entry Type
                  </label>
                  <p className="text-sm font-medium">
                    {selectedEntry.entryType}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    Reference Type
                  </label>
                  <p className="text-sm">{selectedEntry.referenceType}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    Amount
                  </label>
                  <p
                    className={`text-lg font-bold ${selectedEntry.entryType === "CREDIT" ? "text-green-600" : "text-red-600"}`}
                  >
                    {paisaToRupee(selectedEntry.amount)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    Running Balance
                  </label>
                  <p className="text-lg font-bold text-gray-900">
                    {paisaToRupee(selectedEntry.runningBalance)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    Narration
                  </label>
                  <p className="text-sm">{selectedEntry.narration || "-"}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    Date & Time
                  </label>
                  <p className="text-sm">
                    {formatDate(selectedEntry.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    Wallet Type
                  </label>
                  <p className="text-sm">
                    {selectedEntry.wallet?.walletType || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    User
                  </label>
                  <p className="text-sm">
                    {selectedEntry.wallet?.user?.username || "-"}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase">
                    Role
                  </label>
                  <p className="text-sm">
                    {selectedEntry.wallet?.user?.role?.name || "-"}
                  </p>
                </div>
                {selectedEntry.wallet?.user?.parent && (
                  <div>
                    <label className="text-xs text-gray-500 uppercase">
                      Parent
                    </label>
                    <p className="text-sm">
                      {selectedEntry.wallet.user.parent.username}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ledger;
