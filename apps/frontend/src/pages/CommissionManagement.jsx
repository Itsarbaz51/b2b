import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search,
  DollarSign,
  X,
  MoreVertical,
  RefreshCw,
  Plus,
} from "lucide-react";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";

import AddCommissionModal from "../components/forms/AddCommissionModal";
import HeaderSection from "../components/ui/HeaderSection";
import ButtonField from "../components/ui/ButtonField";
import Pagination from "../components/ui/Pagination";
import CommissionTable from "../components/tabels/CommissionTable"; // New import

import {
  getCommissionSettingsByCreatedBy,
  clearCommissionError,
  clearCommissionSuccess,
} from "../redux/slices/commissionSlice";

const CommissionManagement = () => {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const dispatch = useDispatch();
  const searchTimeoutRef = useRef(null);
  const initialLoadRef = useRef(false);

  const {
    commissionSettings = [],
    isLoading = false,
    error: commissionError,
    success: commissionSuccess,
    pagination = {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  } = useSelector((state) => state.commission || {});

  const { currentUser } = useSelector((state) => state.auth);

  const currentPage = pagination.page;
  const totalPages = pagination.totalPages;
  const totalCommissions = pagination.total;
  const limit = pagination.limit;

  // Load commission settings
  const loadCommissions = useCallback(
    async (searchTerm = "", forceRefresh = false, isSearch = false) => {
      try {
        const params = {
          page: isSearch ? 1 : currentPage,
          limit,
          search: searchTerm,
        };

        if (forceRefresh) {
          params.timestamp = Date.now();
          params.refresh = true;
        }

        await dispatch(getCommissionSettingsByCreatedBy(params));
      } catch (error) {
        console.error("Failed to load commissions:", error);
      }
    },
    [dispatch, currentPage, limit]
  );

  // Toast handling
  useEffect(() => {
    if (commissionError) {
      toast.error(commissionError);
      dispatch(clearCommissionError());
    }

    if (commissionSuccess) {
      if (
        commissionSuccess &&
        !commissionSuccess.toLowerCase().includes("created") &&
        !commissionSuccess.toLowerCase().includes("updated") &&
        !commissionSuccess.toLowerCase().includes("deleted")
      ) {
        toast.success(commissionSuccess);
      }
      dispatch(clearCommissionSuccess());
    }
  }, [commissionError, commissionSuccess, dispatch]);

  // Initial load
  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadCommissions();
    }
  }, []);

  // Search with debouncing
  useEffect(() => {
    if (!initialLoadRef.current) return;

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      loadCommissions(search, true, true);
    }, 500);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [search, loadCommissions]);

  // Refresh trigger
  useEffect(() => {
    if (refreshTrigger > 0 && initialLoadRef.current) {
      loadCommissions(search, true);
    }
  }, [refreshTrigger, loadCommissions, search]);

  const handleManualRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) {
        dispatch(
          getCommissionSettingsByCreatedBy({
            page,
            limit,
            search,
            timestamp: Date.now(),
          })
        );
      }
    },
    [dispatch, totalPages, limit, search]
  );

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedCommission(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedCommission(null);
    handleManualRefresh();
  };

  const handleEditCommission = (commission) => {
    setSelectedCommission(commission);
    setShowForm(true);
  };

  const handleMenuToggle = (menuId) => {
    setOpenMenuId(menuId);
  };

  const filteredCommissions = Array.isArray(commissionSettings)
    ? commissionSettings.filter(
        (commission) =>
          commission.role?.name?.toLowerCase().includes(search.toLowerCase()) ||
          commission.targetUser?.firstName
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          commission.service?.name
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          commission.service?.type
            ?.toLowerCase()
            .includes(search.toLowerCase()) ||
          String(commission.commissionValue).includes(search)
      )
    : [];

  return (
    <div>
      <HeaderSection
        title="Commission Management"
        tagLine="Manage commission settings for roles and users"
      />

      {/* Search + Add Commission */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Commission Settings
            </h2>
            <p className="text-gray-600">Manage and monitor commission rules</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search commissions..."
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-gray-50 focus:bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleManualRefresh}
              disabled={isLoading}
              className={`px-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2 transition-colors ${
                isLoading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900"
              }`}
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              {isLoading ? "Refreshing..." : "Refresh"}
            </button>

            {(currentUser.role.name === "ADMIN" ||
              currentUser.role.type === "employee") && (
              <ButtonField
                name="Add Commission"
                isOpen={() => {
                  setSelectedCommission(null);
                  setShowForm(true);
                }}
                icon={Plus}
                css
              />
            )}
          </div>
        </div>
      </div>

      {/* Commission Table Component */}
      <CommissionTable
        commissions={filteredCommissions}
        isLoading={isLoading}
        search={search}
        currentPage={currentPage}
        limit={limit}
        onEditCommission={handleEditCommission}
        onMenuToggle={handleMenuToggle}
        openMenuId={openMenuId}
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

      {/* Add/Edit Commission Modal */}
      {(currentUser.role.name === "ADMIN" ||
        currentUser.role.type === "employee") &&
        showForm && (
          <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
            <AddCommissionModal
              onClose={handleFormClose}
              onSuccess={handleFormSuccess}
              editData={selectedCommission}
            />
          </div>
        )}
    </div>
  );
};

export default CommissionManagement;
