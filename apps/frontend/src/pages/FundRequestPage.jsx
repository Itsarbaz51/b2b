import { useEffect, useState, useMemo } from "react";
import { CreditCard, Landmark, Search, RefreshCw, Clock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import RazorpayFundForm from "../components/forms/RazorpayFundForm";
import AddBankTransferFundForm from "../components/forms/AddBankTransferFundForm";
import FundRequestTable from "../components/tabels/FundRequestTable";

import { createFundRequest } from "../redux/slices/fundSlice";
import { getTransactions } from "../redux/slices/transactionSlice";

import { rupeesToPaise } from "../utils/lib";
import PageHeader from "../components/ui/PageHeader";
import StateCard from "../components/ui/StateCard";

const FundRequestPage = () => {
  const dispatch = useDispatch();
  const { transactions = [], isLoading } = useSelector((s) => s.transaction);

  const [method, setMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");

  const resetForm = () => setMethod(null);

  // fetch fund requests
  const fetchRequests = () => {
    dispatch(
      getTransactions({
        type: "FUND_REQUEST",
      }),
    );
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const currentUser = useSelector((s) => s.auth.currentUser);

  const isAdmin =
    currentUser?.role?.name === "ADMIN" ||
    currentUser?.role?.type === "employee";

  // stats
  const stats = useMemo(() => {
    const pending = transactions.filter((t) => t.status === "PENDING").length;
    const success = transactions.filter((t) => t.status === "SUCCESS").length;

    return {
      total: transactions.length,
      pending,
      success,
    };
  }, [transactions]);

  // bank transfer submit
  const handleBankSubmit = async (data) => {
    try {
      setProcessing(true);

      const result = await dispatch(
        createFundRequest({
          ...data,
          amount: rupeesToPaise(data.amount),
        }),
      );

      if (result?.payload?.success) {
        resetForm();
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleRazorpaySubmit = async (data) => {
    console.log("RAZORPAY", data);
  };

  const handleAction = (type, request) => {
    console.log("Action:", type);
    console.log("Request:", request);

    switch (type) {
      case "view":
        console.log("View fund request", request.txnId);
        break;

      case "approve":
        console.log("Approve fund request", request.txnId);
        break;

      case "reject":
        console.log("Reject fund request", request.txnId);
        break;

      default:
        console.log("Unknown action");
    }
  };

  const filteredRequests = useMemo(() => {
    if (!search) return transactions;

    return transactions.filter(
      (t) =>
        t.txnId?.toLowerCase().includes(search.toLowerCase()) ||
        t.providerReference?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [transactions, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        breadcrumb={["Dashboard", "Fund Requests"]}
        title="Fund Request"
        description="Add funds to your wallet and track request status"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StateCard
          title="Total Requests"
          value={stats.total}
          icon={CreditCard}
        />

        <StateCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          iconColor="text-yellow-600"
        />

        <StateCard
          title="Approved"
          value={stats.success}
          icon={Landmark}
          iconColor="text-green-600"
        />
      </div>

      {/* Action bar */}
      <div className="bg-white p-6 rounded-xl border border-gray-300 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-md">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Txn ID "
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchRequests}
            className="px-4 py-2 border border-gray-300 rounded-lg flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>

          <button
            onClick={() => setMethod("razorpay")}
            className="px-5 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            Razorpay
          </button>

          <button
            onClick={() => setMethod("bank")}
            className="px-5 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2"
          >
            <Landmark className="w-4 h-4" />
            Bank Transfer
          </button>
        </div>
      </div>

      {/* Table */}
      <FundRequestTable
        requests={filteredRequests}
        isAdmin={isAdmin}
        handleAction={handleAction}
      />

      {/* Forms */}
      {method === "razorpay" && (
        <RazorpayFundForm
          onSubmit={handleRazorpaySubmit}
          resetForm={resetForm}
          isProcessing={processing}
        />
      )}

      {method === "bank" && (
        <AddBankTransferFundForm
          onSubmit={handleBankSubmit}
          resetForm={resetForm}
          isProcessing={processing}
        />
      )}
    </div>
  );
};

export default FundRequestPage;
