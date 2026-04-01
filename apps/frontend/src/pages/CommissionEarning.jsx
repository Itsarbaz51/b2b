import { useState, useEffect, useRef, useCallback } from "react";
import { Search, RefreshCw } from "lucide-react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import HeaderSection from "../components/ui/HeaderSection";
import Pagination from "../components/ui/Pagination";
import CommissionEarningTable from "../components/tabels/CommissionEarningTable";

import {
  getCommissionEarnings,
  clearCommissionError,
  clearCommissionSuccess,
  getCommissionSummary,
} from "../redux/slices/commissionSlice";
import { paisaToRupee } from "../utils/lib";
import RefreshToast from "../components/ui/RefreshToast";

const CommissionEarning = () => {
  const [search, setSearch] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const dispatch = useDispatch();
  const searchTimeoutRef = useRef(null);
  const initialLoadRef = useRef(false);

  const {
    commissionEarnings = [],
    isLoading = false,
    error,
    success,
    pagination = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  } = useSelector((state) => state.commission);
  const { commissionSummary } = useSelector((state) => state.commission);
  const { page, limit, totalPages } = pagination;

  // Load earnings
  const loadEarnings = useCallback(
    async (pageNumber = page, forceRefresh = false) => {
      try {
        const params = {
          page: pageNumber,
          limit,
        };

        if (forceRefresh) params.timestamp = Date.now();

        await dispatch(getCommissionEarnings(params));
      } catch (err) {
        console.error("Failed to load earnings:", err);
      }
    },
    [dispatch, page, limit],
  );

  useEffect(() => {
    dispatch(getCommissionSummary());
  }, [dispatch]);

  // Toast
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearCommissionError());
    }

    if (success) {
      toast.success(success);
      dispatch(clearCommissionSuccess());
    }
  }, [error, success, dispatch]);

  // Initial load
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadEarnings();
    }
  }, [loadEarnings]);

  // Refresh
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadEarnings(page, true);
    }
  }, [refreshTrigger, loadEarnings, page]);

  const handleManualRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handlePageChange = (newPage) => {
    loadEarnings(newPage);
  };

  return (
    <div>
      <HeaderSection
        title="Commission Earnings"
        tagLine="View and monitor all commission earnings"
      />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow border border-gray-300">
          <p className="text-gray-500 text-sm">Total Commission</p>
          <h3 className="text-2xl font-bold text-green-600">
            ₹{paisaToRupee(commissionSummary?.totalCommission)}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border border-gray-300">
          <p className="text-gray-500 text-sm">Today Commission</p>
          <h3 className="text-2xl font-bold text-blue-600">
            ₹{paisaToRupee(commissionSummary?.todayCommission)}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border border-gray-300">
          <p className="text-gray-500 text-sm">Monthly Commission</p>
          <h3 className="text-2xl font-bold text-purple-600">
            ₹{paisaToRupee(commissionSummary?.monthlyCommission)}
          </h3>
        </div>

        <div className="bg-white p-5 rounded-xl shadow border border-gray-300">
          <p className="text-gray-500 text-sm">Transactions</p>
          <h3 className="text-2xl font-bold text-gray-800">
            {commissionSummary?.totalTransactions}
          </h3>
        </div>
      </div>
      {/* Search + Refresh */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Commission Earnings
            </h2>
            <p className="text-gray-600">
              Monitor commission earnings from transactions
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search UI (future use) */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

              <input
                type="text"
                placeholder="Search earnings..."
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Refresh */}

            <RefreshToast isLoading={isLoading} onClick={handleManualRefresh} />
          </div>
        </div>
      </div>

      {/* Table */}
      <CommissionEarningTable
        earnings={commissionEarnings}
        isLoading={isLoading}
        search={search}
        currentPage={page}
        limit={limit}
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default CommissionEarning;
