import { useState, useMemo, useCallback } from "react";
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  RefreshCw,
  Landmark,
  CheckCircle2,
  X,
  Download,
  Eye,
} from "lucide-react";
import ButtonField from "../ui/ButtonField";
import HeaderSection from "../ui/HeaderSection";
import FundRequestForm from "../forms/AddFundRequest";
import { useSelector } from "react-redux";
import { usePermissions } from "../hooks/usePermissions";

// Constants
const STATUS_TYPES = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

// Utility functions
const generateOrderId = (prefix = "ORD") => {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}_${year}_${randomDigits}`;
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Custom hook for fund requests management
const useFundRequests = () => {
  const [fundRequests, setFundRequests] = useState([
    {
      id: "BT_2024_5678",
      amount: 5000,
      method: "Bank Transfer",
      status: STATUS_TYPES.APPROVED,
      date: "2024-10-28",
      rrn: "UTR123456789",
    },
    {
      id: "RZP_2024_1234",
      amount: 3000,
      method: "Razorpay",
      status: STATUS_TYPES.PENDING,
      date: "2024-10-29",
      rrn: "RZP789456123",
    },
    {
      id: "BT_2024_9012",
      amount: 2000,
      method: "Bank Transfer",
      status: STATUS_TYPES.REJECTED,
      date: "2024-10-27",
      rrn: "UTR987654321",
    },
  ]);

  const addFundRequest = useCallback((newRequest) => {
    setFundRequests((prev) => [newRequest, ...prev]);
  }, []);

  const updateRequestStatus = useCallback((requestId, status) => {
    setFundRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, status } : request
      )
    );
  }, []);

  return {
    fundRequests,
    addFundRequest,
    updateRequestStatus,
  };
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    [STATUS_TYPES.PENDING]: {
      styles: "bg-yellow-100 text-yellow-700 border-yellow-200",
      icon: Clock,
      label: "Pending",
    },
    [STATUS_TYPES.APPROVED]: {
      styles: "bg-green-100 text-green-700 border-green-200",
      icon: CheckCircle,
      label: "Approved",
    },
    [STATUS_TYPES.REJECTED]: {
      styles: "bg-red-100 text-red-700 border-red-200",
      icon: XCircle,
      label: "Rejected",
    },
  };

  const config = statusConfig[status] || statusConfig[STATUS_TYPES.PENDING];
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${config.styles}`}
    >
      <IconComponent className="w-3 h-3" />
      {config.label}
    </span>
  );
};

// Search and Filter Component - FIXED: Now using fundTabs directly
const SearchFilterBar = ({
  searchTerm,
  onSearchChange,
  onRefresh,
  onMethodSelect,
  fundTabs, // FIXED: Using fundTabs directly from permissions
}) => {
  // Show payment buttons only if user has at least one payment method tab
  const shouldShowPaymentButtons = fundTabs.length > 0;

  // Map fundTabs to button configuration
  const getButtonConfig = (tab) => {
    const config = {
      razorpay: {
        icon: CreditCard,
        label: "Razorpay",
      },
      "bank-transfer": {
        icon: Landmark,
        label: "Bank Transfer",
      },
    };

    return config[tab.id] || { icon: CreditCard, label: tab.label };
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by Order ID, RRN/UTR..."
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 focus:bg-white"
        />
      </div>

      <button
        onClick={onRefresh}
        className="px-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2 transition-colors hover:bg-gray-50"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh
      </button>

      {shouldShowPaymentButtons && (
        <div className="grid grid-cols-2 gap-2">
          {/* Show buttons based on fundTabs from permissions */}
          {fundTabs.map((tab) => {
            const buttonConfig = getButtonConfig(tab);
            return (
              <ButtonField
                key={tab.id}
                isOpen={() => onMethodSelect(tab.id)}
                name={buttonConfig.label}
                icon={buttonConfig.icon}
                type="button"
                className="min-w-[120px]"
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

// Action Buttons Component
const ActionButtons = ({
  onApprove,
  onReject,
  onView,
  onDownload,
  isAdmin = false,
}) => {
  if (!isAdmin) {
    return (
      <div className="flex gap-2">
        <button
          onClick={onView}
          className="p-2 hover:bg-blue-50 rounded transition-colors text-blue-600"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          onClick={onDownload}
          className="p-2 hover:bg-gray-50 rounded transition-colors text-gray-600"
          title="Download Receipt"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={onApprove}
        className="p-2 hover:bg-green-50 rounded transition-colors text-green-600"
        title="Approve Request"
      >
        <CheckCircle2 className="w-4 h-4" />
      </button>
      <button
        onClick={onReject}
        className="p-2 hover:bg-red-50 rounded transition-colors text-red-600"
        title="Reject Request"
      >
        <X className="w-4 h-4" />
      </button>
      <button
        onClick={onView}
        className="p-2 hover:bg-blue-50 rounded transition-colors text-blue-600"
        title="View Details"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );
};

// Permission Denied Component
const PermissionDeniedView = () => {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Permission Denied
        </h2>
        <p className="text-gray-500">
          You don't have permission to access fund services.
        </p>
      </div>
    </div>
  );
};

// Main Fund Request Content Component - FIXED: Using fundTabs directly
const FundRequestContent = () => {
  const [step, setStep] = useState("select-method");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAddNew, setShowAddNew] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { currentUser } = useSelector((state) => state.auth);
  const { fundRequests, addFundRequest, updateRequestStatus } =
    useFundRequests();

  // Use fund permissions hook - FIXED: Now properly using fundTabs
  const permissions = usePermissions("/request-fund");
  const fundTabs = permissions.getPageTabs("/request-fund");

  const [savedAccounts] = useState([
    {
      id: 1,
      accountHolder: "Rahul Kumar",
      account: "1234567890",
      ifsc: "SBIN0001234",
      bankName: "State Bank of India",
    },
    {
      id: 2,
      accountHolder: "Priya Sharma",
      account: "9876543210",
      ifsc: "HDFC0000123",
      bankName: "HDFC Bank",
    },
  ]);

  const [form, setForm] = useState({
    account: "",
    ifsc: "",
    bankName: "",
    accountHolder: "",
    amount: "",
    rrn: "",
    date: new Date().toISOString().split("T")[0],
    file: null,
  });

  // Filtered requests based on search
  const filteredRequests = useMemo(() => {
    if (!searchTerm) return fundRequests;

    const lowerSearch = searchTerm.toLowerCase();
    return fundRequests.filter(
      (request) =>
        request.id.toLowerCase().includes(lowerSearch) ||
        request.rrn.toLowerCase().includes(lowerSearch) ||
        request.method.toLowerCase().includes(lowerSearch)
    );
  }, [fundRequests, searchTerm]);

  // Stats for header
  const requestStats = useMemo(() => {
    const total = fundRequests.length;
    const pending = fundRequests.filter(
      (req) => req.status === STATUS_TYPES.PENDING
    ).length;
    const approved = fundRequests.filter(
      (req) => req.status === STATUS_TYPES.APPROVED
    ).length;

    return { total, pending, approved };
  }, [fundRequests]);

  const handleMethodSelect = useCallback((method) => {
    setPaymentMethod(method);
    setStep("fill-form");
  }, []);

  const handleAccountSelect = useCallback((account) => {
    setSelectedAccount(account);
    setShowAddNew(false);
    setForm((prev) => ({
      ...prev,
      account: account.account,
      ifsc: account.ifsc,
      bankName: account.bankName,
      accountHolder: account.accountHolder,
    }));
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleFileChange = useCallback((e) => {
    setForm((prev) => ({ ...prev, file: e.target.files[0] }));
  }, []);

  const handleRazorpayPayment = useCallback(async () => {
    if (!form.amount || form.amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsProcessing(true);
    const orderId = generateOrderId("RZP");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const newRequest = {
      id: orderId,
      amount: parseFloat(form.amount),
      method: "Razorpay",
      status: STATUS_TYPES.PENDING,
      date: new Date().toISOString().split("T")[0],
      rrn: `RZP${Math.floor(Math.random() * 1000000000)}`,
    };

    addFundRequest(newRequest);
    alert("Razorpay payment initiated successfully!");
    resetForm();
  }, [form.amount, addFundRequest]);

  const handleBankTransferSubmit = useCallback(async () => {
    if (!selectedAccount && !showAddNew) {
      alert("Please select an account or add new account");
      return;
    }
    if (!form.account || !form.ifsc || !form.bankName || !form.accountHolder) {
      alert("Please fill all account details");
      return;
    }
    if (!form.amount || form.amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }
    if (!form.rrn) {
      alert("RRN/UTR is required");
      return;
    }
    if (!form.file) {
      alert("Receipt is required");
      return;
    }

    setIsProcessing(true);
    const orderId = generateOrderId("BT");

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const newRequest = {
      id: orderId,
      amount: parseFloat(form.amount),
      method: "Bank Transfer",
      status: STATUS_TYPES.PENDING,
      date: form.date,
      rrn: form.rrn,
    };

    addFundRequest(newRequest);
    alert(`Fund request submitted successfully!\nOrder ID: ${orderId}`);
    resetForm();
  }, [form, selectedAccount, showAddNew, addFundRequest]);

  const resetForm = useCallback(() => {
    setStep("select-method");
    setPaymentMethod("");
    setSelectedAccount(null);
    setShowAddNew(false);
    setIsProcessing(false);
    setForm({
      account: "",
      ifsc: "",
      bankName: "",
      accountHolder: "",
      amount: "",
      rrn: "",
      date: new Date().toISOString().split("T")[0],
      file: null,
    });
  }, []);

  const handleAction = useCallback(
    (action, requestId) => {
      switch (action) {
        case "approve":
          updateRequestStatus(requestId, STATUS_TYPES.APPROVED);
          break;
        case "reject":
          updateRequestStatus(requestId, STATUS_TYPES.REJECTED);
          break;
        case "view":
          // Handle view details
          console.log("View details for:", requestId);
          break;
        case "download":
          // Handle download receipt
          console.log("Download receipt for:", requestId);
          break;
        default:
          break;
      }
    },
    [updateRequestStatus]
  );

  const isAdmin = currentUser?.role?.name === "ADMIN";

  // Show no access message if no payment methods are available for non-admin users
  if (!isAdmin && fundTabs.length === 0) {
    return (
      <div>
        <HeaderSection
          title="Fund Request"
          tagLine="Manage your fund requests"
          totalCount="0"
          stats={[
            { label: "Pending", value: 0 },
            { label: "Approved", value: 0 },
          ]}
        />
        <div className="mt-8">
          <PermissionDeniedView />
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <HeaderSection
        title="Fund Request"
        tagLine="Manage your fund requests"
        totalCount={requestStats.total.toString()}
        stats={[
          { label: "Pending", value: requestStats.pending },
          { label: "Approved", value: requestStats.approved },
        ]}
      />

      {/* Main Content */}
      <div className="">
        {/* Action Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Request Funds
              </h2>
              <p className="text-gray-600">
                {isAdmin
                  ? "Manage and review fund requests from users"
                  : "Add funds to your account using secure payment methods"}
              </p>
              {/* Show available payment methods info from fundTabs */}
              {!isAdmin && fundTabs.length > 0 && (
                <div className="mt-2 text-sm text-gray-500">
                  Available payment methods:{" "}
                  {fundTabs.map((tab) => tab.label).join(", ")}
                </div>
              )}
            </div>

            <SearchFilterBar
              searchTerm={searchTerm}
              onSearchChange={(e) => setSearchTerm(e.target.value)}
              onRefresh={() => window.location.reload()}
              onMethodSelect={handleMethodSelect}
              fundTabs={fundTabs} // FIXED: Passing fundTabs directly
            />
          </div>
        </div>

        {/* Fund Requests Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Fund Request History
            </h2>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">
                No fund requests found
              </p>
              <p className="text-gray-400 text-sm">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by creating your first fund request"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      RRN/UTR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRequests.map((request) => (
                    <tr
                      key={request.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {request.method}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(request.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-mono">
                        {request.rrn}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {formatDate(request.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={request.status} />
                      </td>
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <ActionButtons
                            onApprove={() =>
                              handleAction("approve", request.id)
                            }
                            onReject={() => handleAction("reject", request.id)}
                            onView={() => handleAction("view", request.id)}
                            onDownload={() =>
                              handleAction("download", request.id)
                            }
                            isAdmin={isAdmin}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Fund Request Form Modal */}
      {step === "fill-form" && (
        <FundRequestForm
          paymentMethod={paymentMethod}
          showAddNew={showAddNew}
          setShowAddNew={setShowAddNew}
          selectedAccount={selectedAccount}
          setSelectedAccount={setSelectedAccount}
          savedAccounts={savedAccounts}
          form={form}
          setForm={setForm}
          isProcessing={isProcessing}
          handleInputChange={handleInputChange}
          handleFileChange={handleFileChange}
          handleRazorpayPayment={handleRazorpayPayment}
          handleBankTransferSubmit={handleBankTransferSubmit}
          handleAccountSelect={handleAccountSelect}
          resetForm={resetForm}
        />
      )}
    </div>
  );
};

// Main Component - FIXED: Proper permission checking
const FundRequestTable = () => {
  // Use fund permissions hook at the top level
  const permissions = usePermissions("/request-fund");

  // Conditionally render based on route accessibility
  if (!permissions.canAccessRoute("/request-fund")) {
    return <PermissionDeniedView />;
  }

  return <FundRequestContent />;
};

export default FundRequestTable;
