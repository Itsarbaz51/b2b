import { useEffect, useMemo, useState } from "react";
import {
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
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { getTransactions } from "../redux/slices/transactionSlice";
import PageHeader from "../components/ui/PageHeader";
import Pagination from "../components/ui/Pagination";
import StateCard from "../components/ui/StateCard";
import TransactionsTable from "../components/tabels/TransactionsTable";
import { getServices } from "../redux/slices/serviceSlice";

const TransactionsPage = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [dateFilter, setDateFilter] = useState("all");
  const itemsPerPage = 10;

  const dispatch = useDispatch();

  const {
    isLoading,
    transactions = [],
    pagination = {},
  } = useSelector((s) => s.transaction) || {};

  const services = useSelector((s) => s.service?.currentItem?.data) || [];

  useEffect(() => {
    dispatch(
      getTransactions({
        page: currentPage,
        limit: itemsPerPage,
        type: selectedCategory?.toUpperCase(),
        search: searchTerm,
        status: activeTab === "pending" ? "PENDING" : "SUCCESS",
        date: dateFilter,
      }),
    );
  }, [
    dispatch,
    currentPage,
    selectedCategory,
    searchTerm,
    activeTab,
    dateFilter,
  ]);

  useEffect(() => {
    dispatch(getServices());
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, activeTab, dateFilter]);

  const fetchTransactions = () => {
    dispatch(
      getTransactions({
        page: currentPage,
        limit: itemsPerPage,
        type: selectedCategory?.toUpperCase(),
        search: searchTerm,
        status: activeTab === "pending" ? "PENDING" : "SUCCESS",
        date: dateFilter,
      }),
    );
  };

  useEffect(() => {
    fetchTransactions();
  }, [
    dispatch,
    currentPage,
    selectedCategory,
    searchTerm,
    activeTab,
    dateFilter,
  ]);
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
      case "SUCCESS":
      case "Credited":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const totalPages = pagination?.totalPages || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;

  // Categories for regular transactions
  const categories = useMemo(() => {
    if (!services.length) return [];

    return [
      { id: "all", label: "All Transactions", icon: Activity },
      ...services.map((p) => ({
        id: p.code,
        label: p.name,
        icon: Activity,
      })),
    ];
  }, [services]);

  const handleAction = (action, transactionId) => {
    alert(
      `${action.toUpperCase()} action for Transaction ID: ${transactionId}`,
    );
  };

  return (
    <div className="">
      <div className="">
        {/* Header */}
        <PageHeader
          breadcrumb={["Dashboard", "Transactions"]}
          title="Transaction Management"
          description="Monitor and manage all pending and completed transactions"
        />

        {/* Summary Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StateCard
            title="Pending"
            value={pagination?.pending || 0}
            icon={Clock}
            iconColor="text-orange-600"
          />

          <StateCard
            title="Success Today"
            value={pagination?.successToday || 0}
            icon={Activity}
            iconColor="text-green-600"
          />

          <StateCard
            title="Total Volume"
            value={`₹${pagination?.totalVolume || 0}`}
            icon={DollarSign}
            iconColor="text-blue-600"
          />

          <StateCard
            title="Total Commission"
            value={`₹${pagination?.totalCommission || 0}`}
            icon={TrendingUp}
            iconColor="text-purple-600"
          />
        </div>

        {/* Transactions Table */}
        <TransactionsTable
          transactions={transactions}
          categories={categories}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          startIndex={startIndex}
          getTypeIcon={getTypeIcon}
          getStatusColor={getStatusColor}
          handleAction={handleAction}
          onRefresh={fetchTransactions}
          loading={isLoading}
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default TransactionsPage;
