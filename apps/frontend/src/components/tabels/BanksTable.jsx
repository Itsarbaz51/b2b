import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Search,
  Eye,
  CheckCircle2,
  X,
  Clock,
  Shield,
  FileText,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  RefreshCw,
  User,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllBanks,
  verifyBank,
  getBankDetail,
} from "../../redux/slices/bankSlice";
import ConfirmCard from "../ui/ConfirmCard";
import Bank from "../../pages/view/Bank";
import Pagination from "../ui/Pagination";
import { useDebounce } from "use-debounce";
import StateCard from "../ui/StateCard";
import RefreshToast from "../ui/RefreshToast";

// Constants
const TABLE_LIMIT = 10;
const DEBOUNCE_DELAY = 400;

// Status configuration
const STATUS_CONFIG = {
  VERIFIED: {
    classes: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    icon: <Shield className="w-3 h-3" />,
    label: "VERIFIED",
  },
  PENDING: {
    classes: "bg-amber-50 text-amber-700 border border-amber-200",
    icon: <Clock className="w-3 h-3" />,
    label: "PENDING",
  },
  REJECT: {
    classes: "bg-red-50 text-red-700 border border-red-200",
    icon: <AlertCircle className="w-3 h-3" />,
    label: "REJECTED",
  },
};

const BankTable = () => {
  const dispatch = useDispatch();

  // State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedAction, setSelectedAction] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const [showModal, setShowModal] = useState(false);

  const [showViewKyc, setShowViewKyc] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounced search
  const [debouncedSearch] = useDebounce(search, DEBOUNCE_DELAY);

  // Redux selectors with memoization
  const { currentUser = {} } = useSelector((state) => state.auth);
  const bankData = useSelector((state) => state.bank?.bankList?.banks || []);
  const bankMeta = useSelector((state) => state.bank?.bankList?.data?.meta);
  const bankDetail = useSelector((state) => state.bank?.bankDetail);

  const totalPages = useMemo(() => bankMeta?.totalPages || 1, [bankMeta]);
  const isAdmin = useMemo(
    () =>
      currentUser.role?.name === "ADMIN" ||
      currentUser.role?.type === "employee",
    [currentUser]
  );

  // Fetch banks with error handling
  const fetchBankData = useCallback(
    async (showLoading = false) => {
      if (showLoading) setIsRefreshing(true);

      try {
        await dispatch(
          getAllBanks({
            search: debouncedSearch,
            page: currentPage,
            limit: TABLE_LIMIT,
            status: statusFilter === "ALL" ? undefined : statusFilter,
            sort: sortOrder,
          })
        );
      } catch (error) {
        console.error("Failed to fetch bank data:", error);
      } finally {
        if (showLoading) setIsRefreshing(false);
      }
    },
    [debouncedSearch, currentPage, statusFilter, sortOrder, dispatch]
  );

  // Fetch data on dependencies change
  useEffect(() => {
    fetchBankData();
  }, [fetchBankData]);

  // Handlers
  const toggleSort = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setCurrentPage(1);
  }, []);

  const handleActionClick = useCallback((action, id) => {
    setSelectedAction(action);
    setSelectedId(id);
    setShowModal(true);
  }, []);

  const handleViewShow = useCallback(
    async (id) => {
      try {
        await dispatch(getBankDetail(id));
        setShowViewKyc(true);
      } catch (error) {
        console.error("Failed to fetch bank details:", error);
      }
    },
    [dispatch]
  );

  const confirmAction = useCallback(
    (reason = "") => {
      const trimmedReason = reason.trim();

      try {
        if (selectedAction === "VERIFIED") {
          dispatch(
            verifyBank({
              id: selectedId,
              status: "VERIFIED",
              bankRejectionReason: "",
            })
          );
        } else if (selectedAction === "REJECT") {
          dispatch(
            verifyBank({
              id: selectedId,
              status: "REJECT",
              bankRejectionReason: trimmedReason,
            })
          );
        }
      } catch (error) {
        console.error("Bank verification error:", error);
        alert("Failed to update Bank. Please try again.");
      } finally {
        setShowModal(false);
        setSelectedAction(null);
        setSelectedId(null);
      }
    },
    [selectedAction, selectedId, dispatch]
  );

  const handleRefresh = useCallback(() => {
    fetchBankData(true);
  }, [fetchBankData]);

  const handleStatusFilterChange = useCallback((value) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    setCurrentPage(1);
  }, []);

  // Get status display configuration
  const getStatusConfig = useCallback((status) => {
    return (
      STATUS_CONFIG[status] || {
        classes: "bg-gray-50 text-gray-700 border border-gray-300",
        icon: <FileText className="w-3 h-3" />,
        label: status,
      }
    );
  }, []);

  // Memoized table rows
  const tableRows = useMemo(() => {
    if (!bankData.length) {
      return (
        <tr>
          <td colSpan={7} className="text-center py-6 text-gray-500">
            No bank records found.
          </td>
        </tr>
      );
    }

    return bankData.map((bank, index) => {
      const status = bank.status || "PENDING";
      const { classes, icon, label } = getStatusConfig(status);

      return (
        <tr key={bank.id} className="hover:bg-gray-50 transition-colors">
          <td className="px-6 py-4">{index + 1}</td>
          <td className="px-6 py-4 whitespace-nowrap">
            {new Date(bank.createdAt).toLocaleDateString()}
          </td>
          <td className="px-6 py-4">{bank.bankName}</td>
          <td className="px-6 py-4">{bank.accountHolder}</td>
          <td className="px-6 py-4 font-mono">{bank.accountNumber}</td>
          <td className="px-6 py-4 font-mono">{bank.ifscCode}</td>
          <td className="px-6 py-4">
            <span
              className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${classes}`}
            >
              {icon} {label}
            </span>
          </td>
          {isAdmin && (
            <td className="px-6 py-4">
              <div className="flex gap-2">
                {(status === "PENDING" || status === "REJECT") && (
                  <button
                    onClick={() => handleActionClick("VERIFIED", bank.id)}
                    className="text-emerald-600 hover:text-emerald-800 transition-colors"
                    title="Verify"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                {(status === "PENDING" || status === "VERIFIED") && (
                  <button
                    onClick={() => handleActionClick("REJECT", bank.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Reject"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleViewShow(bank.id)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="View Details"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </td>
          )}
        </tr>
      );
    });
  }, [bankData, isAdmin, handleActionClick, handleViewShow, getStatusConfig]);

  const statusCounts = useMemo(() => {
    return {
      total: bankData.length,
      verified: bankData.filter((p) => p.status === "VERIFIED").length,
      pending: bankData.filter((p) => p.status === "PENDING").length,
      rejected: bankData.filter((p) => p.status === "REJECT").length,
    };
  }, [bankData]);

  const statusCards = [
    {
      title: "Total",
      value: statusCounts.total,
      icon: User,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Verified",
      value: statusCounts.verified,
      icon: Shield,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Pending",
      value: statusCounts.pending,
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Rejected",
      value: statusCounts.rejected,
      icon: AlertCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
    },
  ];
  return (
    <div className="space-y-6">
      {/* Modals */}
      {showModal && (
        <ConfirmCard
          actionType={selectedAction}
          user={bankData.find((b) => b.id === selectedId)?.user}
          isClose={() => {
            setShowModal(false);
            setSelectedAction(null);
            setSelectedId(null);
          }}
          isSubmit={confirmAction}
          {...(selectedAction === "REJECT" && {
            predefinedReasons: [
              "Invalid or unreadable ID document",
              "Mismatched name or personal details",
              "Expired identification document",
              "Blurry or unclear document image",
              "Incomplete proof of address",
              "Document appears to be fraudulent",
              "Selfie does not match ID photo",
              "Incorrect document type uploaded",
              "Incomplete KYC submission",
              "Other",
            ],
          })}
        />
      )}

      {/* Header */}
      <div className="mb-8 space-y-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statusCards.map((card, idx) => (
            <StateCard key={idx} {...card} />
          ))}
        </div>
      </div>

      {/* Filter/Search Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">
        <div className="p-6 border-b border-gray-300 bg-gray-50/50">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by Bank Name, Account number"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              <select
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECT">Rejected</option>
              </select>
            </div>

            <RefreshToast isLoading={isRefreshing} onClick={handleRefresh} />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                <th className="px-6 py-3">#</th>

                <th
                  className="px-6 py-3 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={toggleSort}
                >
                  <div className="flex items-center gap-1">
                    Created
                    {sortOrder === "asc" ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </div>
                </th>
                <th className="px-6 py-3">Bank Name</th>
                <th className="px-6 py-3">Account Name</th>
                <th className="px-6 py-3">Account Number</th>
                <th className="px-6 py-3">IFSC</th>
                <th className="px-6 py-3">Status</th>
                {isAdmin && <th className="px-6 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableRows}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {bankData?.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* View KYC Modal */}
      {showViewKyc && (
        <Bank
          viewedBank={bankDetail}
          isOpen={showViewKyc}
          onClose={() => setShowViewKyc(false)}
        />
      )}
    </div>
  );
};

export default BankTable;
