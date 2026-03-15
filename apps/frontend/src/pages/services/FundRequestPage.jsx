import { useEffect, useState, useMemo } from "react";
import { CreditCard, Landmark, Search, RefreshCw, Clock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import AddBankTransferFundForm from "../../components/forms/services/AddBankTransferFundForm";
import FundRequestTable from "../../components/tabels/services/FundRequestTable";

import {
  createFundRequest,
  verifyFundRequest,
} from "../../redux/slices/fundSlice";
const rejectReasons = [
  "Invalid RRN",
  "Amount mismatch",
  "Fake payment screenshot",
  "Duplicate payment",
  "Bank transaction not found",
];
import { getTransactions } from "../../redux/slices/transactionSlice";

import { rupeesToPaise } from "../../utils/lib";
import PageHeader from "../../components/ui/PageHeader";
import StateCard from "../../components/ui/StateCard";
import ConfirmCard from "../../components/ui/ConfirmCard";
import AddRazorpayFundForm from "../../components/forms/services/AddRazorpayFundForm";
import { usePermissions } from "../../components/hooks/usePermission";
import { SERVICES } from "../../utils/constants";

const FundRequestPage = () => {
  const dispatch = useDispatch();
  const [confirmAction, setConfirmAction] = useState(null);
  const { transactions = [], isLoading } = useSelector((s) => s.transaction);
  const currentUser = useSelector((s) => s.auth.currentUser);

  const [method, setMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");

  const resetForm = () => setMethod(null);

  const isAdmin =
    currentUser?.role?.name === "ADMIN" ||
    currentUser?.role?.type === "employee";

  const { canProcess, serviceId } = usePermissions(SERVICES.FUND_REQUEST);

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

  const stats = useMemo(() => {
    const pending = transactions.filter((t) => t.status === "PENDING").length;
    const success = transactions.filter((t) => t.status === "SUCCESS").length;

    return {
      total: transactions.length,
      pending,
      success,
    };
  }, [transactions]);

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

  const handleConfirmSubmit = async (reason) => {
    try {
      const { action, request } = confirmAction;

      await dispatch(verifyFundRequest(request.id, action, reason));

      fetchRequests();
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const handleAction = (type, request) => {
    if (type === "approve") {
      setConfirmAction({
        action: "APPROVE",
        request,
      });
    }

    if (type === "reject") {
      setConfirmAction({
        action: "REJECT",
        request,
      });
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
            placeholder="Search Txn ID"
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

          {!isAdmin && canProcess && (
            <>
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
            </>
          )}
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
        <AddRazorpayFundForm
          resetForm={resetForm}
          onSuccess={fetchRequests}
          serviceId={serviceId}
        />
      )}

      {method === "bank" && (
        <AddBankTransferFundForm
          onSubmit={handleBankSubmit}
          resetForm={resetForm}
          isProcessing={processing}
          serviceId={serviceId}
        />
      )}

      {confirmAction && (
        <ConfirmCard
          actionType={confirmAction.action}
          user={confirmAction.request}
          predefinedReasons={rejectReasons}
          isClose={() => setConfirmAction(null)}
          isSubmit={handleConfirmSubmit}
        />
      )}
    </div>
  );
};

export default FundRequestPage;
