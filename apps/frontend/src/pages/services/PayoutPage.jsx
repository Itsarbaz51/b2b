import { useEffect, useState, useMemo } from "react";
import { CreditCard, Landmark, Search, RefreshCw, Clock } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import {
  checkPayoutStatus,
  createPayout,
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
import ConfirmCard from "../../components/ui/ConfirmCard";
import { verifyBankAccount } from "../../redux/slices/bankVerificationSlice";

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
  const [confirmAction, setConfirmAction] = useState(null);

  const resetForm = () => {
    setMethod(null);
    setIsVerified(false);
  };

  const isAdmin =
    currentUser?.role?.name === "ADMIN" ||
    currentUser?.role?.type === "employee";

  const { canProcess, defaultProvider } = usePermissions(SERVICES.PAYOUT);

  const { defaultProvider: defaultProviderBankVerify } = usePermissions(
    SERVICES.BANK_VERIFICATION,
  );

  const serviceProviderMappingId = defaultProvider?.serviceProviderMappingId;

  const bankVerifyId = defaultProviderBankVerify?.serviceProviderMappingId;

  const fetchRequests = () => {
    dispatch(getTransactions({ type: "PAYOUT" }));
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
        verifyBankAccount({
          serviceProviderMappingId: bankVerifyId,
          number: form.mobile,
          accountNo: form.accountNo,
          ifscCode: form.ifscCode,
          idempotencyKey,
        }),
      );

      if (res?.payload?.success) {
        setIsVerified(true);

        callback(res?.payload?.data?.beneficiaryName || "");
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
      console.log(result);

      if (result?.success) {
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

  const handleConfirmSubmit = async () => {
    try {
      const { request, serviceProviderMappingId } = confirmAction;

      await dispatch(
        checkPayoutStatus({
          txnId: request.txnId,
          serviceProviderMappingId,
        }),
      );

      fetchRequests();
      setConfirmAction(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = (type, request) => {
    if (type === "check-status") {
      setConfirmAction({
        request,
        serviceProviderMappingId,
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumb={["Dashboard", "Payout"]}
        title="Payout"
        description="Transfer funds to bank account"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StateCard title="Total Payout" value={stats.total} icon={CreditCard} />
        <StateCard title="Pending" value={stats.pending} icon={Clock} />
        <StateCard title="Success" value={stats.success} icon={Landmark} />
        <StateCard title="Refund" value={0} icon={Landmark} />
      </div>

      <div className="bg-white p-6 rounded-xl border flex justify-between">
        <input
          placeholder="Search Txn ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded-lg"
        />

        <div className="flex gap-3">
          <button onClick={fetchRequests}>Refresh</button>

          {canProcess && (
            <button onClick={() => setMethod(true)}>Payout</button>
          )}
        </div>
      </div>

      <PayoutTable
        requests={filteredRequests}
        isAdmin={isAdmin}
        handleAction={handleAction}
      />

      {method && (
        <AddPayoutForm
          resetForm={resetForm}
          onSubmit={handleSubmit}
          onVerify={handleVerify}
          isVerified={isVerified}
          setIsVerified={setIsVerified}
          verifying={verifying}
          isLoading={processing}
        />
      )}

      {confirmAction && (
        <ConfirmCard
          actionType="Activate"
          user={confirmAction.request}
          isClose={() => setConfirmAction(null)}
          isSubmit={handleConfirmSubmit}
        />
      )}
    </div>
  );
};

export default PayoutPage;
