import { useEffect, useState, useMemo } from "react";
import { CreditCard, Landmark, Search, RefreshCw, Clock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import {
  createPayout,
  verifyPayoutAccount,
} from "../../redux/slices/payoutSlice";
import { getTransactions } from "../../redux/slices/transactionSlice";

import { rupeesToPaise } from "../../utils/lib";

import PageHeader from "../../components/ui/PageHeader";
import StateCard from "../../components/ui/StateCard";
import { usePermissions } from "../../hooks/usePermission";
import { SERVICES } from "../../utils/constants";

import PayoutTable from "../../components/tabels/services/PayoutTable";
import AddPayoutForm from "../../components/forms/services/AddPayoutForm";
import { v4 as uuidv4 } from "uuid";

const PayoutPage = () => {
  const dispatch = useDispatch();
  const { transactions = [] } = useSelector((s) => s.transaction);
  const currentUser = useSelector((s) => s.auth.currentUser);

  const [method, setMethod] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [search, setSearch] = useState("");
  const [idempotencyKey] = useState(uuidv4());

  const resetForm = () => {
    setMethod(null);
    setIsVerified(false);
  };

  const isAdmin =
    currentUser?.role?.name === "ADMIN" ||
    currentUser?.role?.type === "employee";

  const { canProcess, defaultProvider } = usePermissions(SERVICES.PAYOUT);

  const serviceProviderMappingId = defaultProvider.serviceProviderMappingId;

  const fetchRequests = () => {
    dispatch(
      getTransactions({
        type: "PAYOUT",
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

  /* ---------------- VERIFY ACCOUNT ---------------- */

  const handleVerify = async (form, callback) => {
    try {
      setVerifying(true);

      const res = await dispatch(
        verifyPayoutAccount({
          provider: "WONDERPAY",
          serviceProviderMappingId,
          number: form.mobile,
          accountNo: form.accountNo,
          ifscCode: form.ifscCode,
          clientOrderId: Date.now().toString(),
        }),
      );

      if (res?.success || res?.payload?.success) {
        setIsVerified(true);

        callback(res?.data?.beneficiaryName);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  /* ---------------- CREATE PAYOUT ---------------- */

  const handleSubmit = async (data) => {
    try {
      setProcessing(true);

      const result = await dispatch(
        createPayout({
          serviceProviderMappingId,
          number: data.mobile,
          amount: Number(rupeesToPaise(data.amount)),
          transferMode: data.transferMode,
          beneficiaryName: data.beneficiaryName,
          accountNo: data.accountNo,
          ifscCode: data.ifscCode,
          vpa: data.vpa,
          idempotencyKey,
        }),
      );

      if (result?.success || result?.payload?.success) {
        resetForm();
        fetchRequests();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
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
        breadcrumb={["Dashboard", "Payout"]}
        title="Payout"
        description="Transfer funds to bank account"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StateCard title="Total Payout" value={stats.total} icon={CreditCard} />

        <StateCard
          title="Pending"
          value={stats.pending}
          icon={Clock}
          iconColor="text-yellow-600"
        />

        <StateCard
          title="Success"
          value={stats.success}
          icon={Landmark}
          iconColor="text-green-600"
        />

        <StateCard
          title="Refund"
          value={0}
          icon={Landmark}
          iconColor="text-red-600"
        />
      </div>

      {/* ACTION BAR */}

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

          {canProcess && (
            <button
              onClick={() => setMethod(true)}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Payout
            </button>
          )}
        </div>
      </div>

      {/* TABLE */}

      <PayoutTable requests={filteredRequests} isAdmin={isAdmin} />

      {/* FORM */}

      {method && (
        <AddPayoutForm
          resetForm={resetForm}
          onSubmit={handleSubmit}
          onVerify={handleVerify}
          serviceProviderMappingId={serviceProviderMappingId}
          isVerified={isVerified}
          verifying={verifying}
          isLoading={processing}
        />
      )}
    </div>
  );
};

export default PayoutPage;
