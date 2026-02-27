import MoneyTransferForm from "../forms/MoneyTransferForm";
import PageHeader from "../ui/PageHeader";

const PayoutTable = () => {
  return (
    <div className="">
      <div className="mb-8">
        <PageHeader
          breadcrumb={["Dashboard", "Payout"]}
          title="Payout Accounts"
          description="Manage payout accounts and bank details with modern interface"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden backdrop-blur-sm">
        <MoneyTransferForm />
      </div>
    </div>
  );
};

export default PayoutTable;
