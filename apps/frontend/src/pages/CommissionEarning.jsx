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
} from "../redux/slices/commissionSlice";

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

  const currentPage = pagination.page;
  const totalPages = pagination.totalPages;
  const limit = pagination.limit;

  // Load earnings
  const loadEarnings = useCallback(
    async (searchTerm = "", forceRefresh = false, isSearch = false) => {
      try {
        const params = {
          page: isSearch ? 1 : currentPage,
          limit,
          search: searchTerm,
        };

        if (forceRefresh) {
          params.timestamp = Date.now();
        }

        await dispatch(getCommissionEarnings(params));
      } catch (error) {
        console.error("Failed to load earnings:", error);
      }
    },
    [dispatch, currentPage, limit],
  );

  // Toast handling
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
  }, []);

  // Search debounce
  useEffect(() => {
    if (!initialLoadRef.current) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadEarnings(search, true, true);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, loadEarnings]);

  // Refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0 && initialLoadRef.current) {
      loadEarnings(search, true);
    }
  }, [refreshTrigger, loadEarnings, search]);

  const handleManualRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handlePageChange = useCallback(
    (page) => {
      dispatch(
        getCommissionEarnings({
          page,
          limit,
          search,
          timestamp: Date.now(),
        }),
      );
    },
    [dispatch, limit, search],
  );

  return (
    <div>
      <HeaderSection
        title="Commission Earnings"
        tagLine="View and monitor all commission earnings"
      />

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
            {/* Search */}
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
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className={`px-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2 ${
                isLoading
                  ? "bg-gray-100 text-gray-400"
                  : "bg-white hover:bg-gray-50"
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </div>

      {/* Earnings Table */}
      <CommissionEarningTable
        earnings={commissionEarnings}
        isLoading={isLoading}
        search={search}
        currentPage={currentPage}
        limit={limit}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
};

export default CommissionEarning;
