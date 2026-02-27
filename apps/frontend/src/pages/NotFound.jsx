import React, { useState, useEffect } from "react";
import {
  Users,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings,
  BarChart3,
  Shield,
  UserPlus,
  Eye,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Percent,
} from "lucide-react";

const NotFound = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [commissionSettings, setCommissionSettings] = useState({
    super_admin: 0.5,
    admin: 1.0,
    agent: 2.0,
  });

  // Mock Data Initialize
  useEffect(() => {
    const mockUsers = [
      {
        id: 1,
        name: "Arbaz Khan",
        email: "arbaz@superadmin.com",
        role: "super_admin",
        wallet_balance: 50000,
        parent_id: null,
        kyc_status: "verified",
        created_at: "2024-01-15",
      },
      {
        id: 2,
        name: "Rajesh Sharma",
        email: "rajesh@admin.com",
        role: "admin",
        wallet_balance: 25000,
        parent_id: 1,
        kyc_status: "verified",
        created_at: "2024-02-01",
      },
      {
        id: 3,
        name: "Priya Singh",
        email: "priya@agent.com",
        role: "agent",
        wallet_balance: 5000,
        parent_id: 2,
        kyc_status: "pending",
        created_at: "2024-02-15",
      },
    ];

    const mockTransactions = [
      {
        id: 1,
        user_id: 3,
        type: "payin",
        amount: 2000,
        status: "success",
        razorpay_order_id: "order_123",
        commission: 40,
        created_at: "2024-08-29 10:30:00",
      },
      {
        id: 2,
        user_id: 3,
        type: "payout",
        amount: 1500,
        status: "processing",
        razorpay_payout_id: "payout_456",
        commission: 30,
        created_at: "2024-08-29 11:15:00",
      },
    ];

    setUsers(mockUsers);
    setTransactions(mockTransactions);
    setCurrentUser(mockUsers[0]); // Default login as
  }, []);

  const LoginForm = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = (e) => {
      e.preventDefault();
      const user = users.find((u) => u.email === email);
      if (user) {
        setCurrentUser(user);
      } else {
        alert("Invalid credentials");
      }
    };

    return (
      <div className=" bg-red-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg w-96">
          <div className="text-center mb-6">
            <Shield className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">
              Razorpay Payment System
            </h2>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-200"
            >
              Login
            </button>
          </form>
          <div className="mt-4 text-xs text-gray-500">
            <p>Demo Accounts:</p>
            <p>Super Admin: arbaz@superadmin.com</p>
            <p>Admin: rajesh@admin.com</p>
            <p>Agent: priya@agent.com</p>
          </div>
        </div>
      </div>
    );
  };

  const Dashboard = () => {
    const getUserStats = () => {
      const userTransactions = transactions.filter((t) => {
        if (currentUser.role === "super_admin") return true;
        if (currentUser.role === "admin") {
          const agentIds = users
            .filter((u) => u.parent_id === currentUser.id)
            .map((u) => u.id);
          return agentIds.includes(t.user_id) || t.user_id === currentUser.id;
        }
        return t.user_id === currentUser.id;
      });

      const totalPayin = userTransactions
        .filter((t) => t.type === "payin" && t.status === "success")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalPayout = userTransactions
        .filter((t) => t.type === "payout" && t.status === "success")
        .reduce((sum, t) => sum + t.amount, 0);
      const totalCommission = userTransactions.reduce(
        (sum, t) => sum + (t.commission || 0),
        0
      );

      return {
        totalPayin,
        totalPayout,
        totalCommission,
        transactionCount: userTransactions.length,
      };
    };

    const stats = getUserStats();

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-600 to-red-800 text-white p-6 rounded-lg">
          <h1 className="text-2xl font-bold mb-2">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-red-100 capitalize">
            {currentUser.role} Dashboard
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Wallet Balance</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{currentUser.wallet_balance.toLocaleString()}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payin</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{stats.totalPayin.toLocaleString()}
                </p>
              </div>
              <ArrowUpCircle className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payout</p>
                <p className="text-2xl font-bold text-red-600">
                  ₹{stats.totalPayout.toLocaleString()}
                </p>
              </div>
              <ArrowDownCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Commission Earned</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{stats.totalCommission.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {currentUser.role !== "agent" && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setActiveTab("users")}
                className="flex items-center justify-center p-4 bg-red-50 hover:bg-red-100 rounded-lg transition duration-200"
              >
                <UserPlus className="h-6 w-6 text-red-600 mr-2" />
                <span className="text-red-700">Manage Users</span>
              </button>
              <button
                onClick={() => setActiveTab("commission")}
                className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition duration-200"
              >
                <Percent className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-blue-700">Commission Settings</span>
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition duration-200"
              >
                <BarChart3 className="h-6 w-6 text-green-600 mr-2" />
                <span className="text-green-700">View Reports</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const PayinComponent = () => {
    const [amount, setAmount] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("upi");
    const [loading, setLoading] = useState(false);

    const handlePayin = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        // Simulate Razorpay Order Creation
        const orderData = {
          amount: parseFloat(amount) * 100, // Convert to paise
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          payment_capture: 1,
        };

        // Mock Razorpay Checkout
        const options = {
          key: "rzp_test_XXXXXXXXXX",
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Payment System",
          description: "Wallet Recharge",
          order_id: `order_${Date.now()}`,
          handler: function (response) {
            // Success handler
            const newTransaction = {
              id: transactions.length + 1,
              user_id: currentUser.id,
              type: "payin",
              amount: parseFloat(amount),
              status: "success",
              razorpay_order_id: response.razorpay_order_id,
              commission:
                parseFloat(amount) *
                (commissionSettings[currentUser.role] / 100),
              created_at: new Date().toISOString(),
            };

            setTransactions([...transactions, newTransaction]);

            // Update wallet balance
            const updatedUsers = users.map((u) =>
              u.id === currentUser.id
                ? {
                    ...u,
                    wallet_balance: u.wallet_balance + parseFloat(amount),
                  }
                : u
            );
            setUsers(updatedUsers);
            setCurrentUser({
              ...currentUser,
              wallet_balance: currentUser.wallet_balance + parseFloat(amount),
            });

            alert("Payment Successful! Wallet recharged.");
            setAmount("");
          },
          prefill: {
            name: currentUser.name,
            email: currentUser.email,
          },
          theme: {
            color: "#dc2626",
          },
        };

        // Simulate opening Razorpay checkout (in real app, this would be actual Razorpay)
        setTimeout(() => {
          const confirmed = confirm(
            `Simulate payment of ₹${amount} via ${paymentMethod.toUpperCase()}?`
          );
          if (confirmed) {
            options.handler({ razorpay_order_id: `order_${Date.now()}` });
          }
          setLoading(false);
        }, 1000);
      } catch (error) {
        alert("Payment failed. Please try again.");
        setLoading(false);
      }
    };

    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-6 text-red-700">
          Add Money to Wallet
        </h3>
        <form onSubmit={handlePayin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              max="50000"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="Enter amount"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
            >
              <option value="upi">UPI</option>
              <option value="netbanking">Net Banking</option>
              <option value="card">Credit/Debit Card</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>

          <div className="bg-red-50 p-3 rounded-md">
            <p className="text-sm text-red-700">
              Commission: {commissionSettings[currentUser.role]}% | You'll pay:
              ₹
              {amount
                ? (
                    parseFloat(amount) +
                    (parseFloat(amount) *
                      commissionSettings[currentUser.role]) /
                      100
                  ).toFixed(2)
                : "0"}
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !amount}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 transition duration-200"
          >
            {loading ? "Processing..." : `Pay ₹${amount || "0"} via Razorpay`}
          </button>
        </form>
      </div>
    );
  };

  const PayoutComponent = () => {
    const [amount, setAmount] = useState("");
    const [bankDetails, setBankDetails] = useState({
      account_number: "",
      ifsc: "",
      account_holder: currentUser?.name || "",
    });
    const [loading, setLoading] = useState(false);

    const handlePayout = async (e) => {
      e.preventDefault();

      if (currentUser.kyc_status !== "verified") {
        alert("Please complete KYC verification first!");
        return;
      }

      if (parseFloat(amount) > currentUser.wallet_balance) {
        alert("Insufficient wallet balance!");
        return;
      }

      setLoading(true);

      try {
        // Simulate RazorpayX Payout API call
        const payoutData = {
          account_number: bankDetails.account_number,
          fund_account: {
            account_type: "bank_account",
            bank_account: {
              name: bankDetails.account_holder,
              ifsc: bankDetails.ifsc,
              account_number: bankDetails.account_number,
            },
          },
          amount: parseFloat(amount) * 100,
          currency: "INR",
          mode: "IMPS",
          purpose: "payout",
        };

        // Deduct from wallet immediately
        const updatedUsers = users.map((u) =>
          u.id === currentUser.id
            ? { ...u, wallet_balance: u.wallet_balance - parseFloat(amount) }
            : u
        );
        setUsers(updatedUsers);
        setCurrentUser({
          ...currentUser,
          wallet_balance: currentUser.wallet_balance - parseFloat(amount),
        });

        // Create payout transaction
        const newTransaction = {
          id: transactions.length + 1,
          user_id: currentUser.id,
          type: "payout",
          amount: parseFloat(amount),
          status: "processing",
          razorpay_payout_id: `payout_${Date.now()}`,
          commission:
            parseFloat(amount) * (commissionSettings[currentUser.role] / 100),
          created_at: new Date().toISOString(),
          bank_details: bankDetails,
        };

        setTransactions([...transactions, newTransaction]);

        // Simulate webhook response after 3 seconds
        setTimeout(() => {
          const finalStatus = Math.random() > 0.1 ? "success" : "failed";

          setTransactions((prev) =>
            prev.map((t) =>
              t.id === newTransaction.id ? { ...t, status: finalStatus } : t
            )
          );

          if (finalStatus === "failed") {
            // Refund on failure
            const refundUsers = users.map((u) =>
              u.id === currentUser.id
                ? {
                    ...u,
                    wallet_balance: u.wallet_balance + parseFloat(amount),
                  }
                : u
            );
            setUsers(refundUsers);
            setCurrentUser({
              ...currentUser,
              wallet_balance: currentUser.wallet_balance + parseFloat(amount),
            });
            alert("Payout failed! Amount refunded to wallet.");
          } else {
            alert("Payout successful! Amount transferred to your bank.");
          }
        }, 3000);

        alert("Payout initiated! You will receive confirmation shortly.");
        setAmount("");
        setBankDetails({
          account_number: "",
          ifsc: "",
          account_holder: currentUser.name,
        });
      } catch (error) {
        alert("Payout failed. Please try again.");
        // Refund on error
        const refundUsers = users.map((u) =>
          u.id === currentUser.id
            ? { ...u, wallet_balance: u.wallet_balance + parseFloat(amount) }
            : u
        );
        setUsers(refundUsers);
        setCurrentUser({
          ...currentUser,
          wallet_balance: currentUser.wallet_balance + parseFloat(amount),
        });
      }

      setLoading(false);
    };

    return (
      <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-6 text-red-700">
          Withdraw Money
        </h3>

        {currentUser.kyc_status !== "verified" && (
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mb-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ Complete KYC verification to enable payouts
            </p>
          </div>
        )}

        <form onSubmit={handlePayout} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="100"
              max={currentUser.wallet_balance}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="Enter amount"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Available: ₹{currentUser.wallet_balance.toLocaleString()}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Holder Name
            </label>
            <input
              type="text"
              value={bankDetails.account_holder}
              onChange={(e) =>
                setBankDetails({
                  ...bankDetails,
                  account_holder: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Account Number
            </label>
            <input
              type="text"
              value={bankDetails.account_number}
              onChange={(e) =>
                setBankDetails({
                  ...bankDetails,
                  account_number: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="Enter account number"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              IFSC Code
            </label>
            <input
              type="text"
              value={bankDetails.ifsc}
              onChange={(e) =>
                setBankDetails({
                  ...bankDetails,
                  ifsc: e.target.value.toUpperCase(),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
              placeholder="e.g., HDFC0000001"
              pattern="[A-Z][A-Z0-9]"
              required
            />
          </div>

          <div className="bg-red-50 p-3 rounded-md">
            <p className="text-sm text-red-700">
              Payout Charges: {commissionSettings[currentUser.role]}% | You'll
              receive: ₹
              {amount
                ? (
                    parseFloat(amount) -
                    (parseFloat(amount) *
                      commissionSettings[currentUser.role]) /
                      100
                  ).toFixed(2)
                : "0"}
            </p>
          </div>

          <button
            type="submit"
            disabled={
              loading || !amount || currentUser.kyc_status !== "verified"
            }
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 transition duration-200"
          >
            {loading ? "Processing..." : "Initiate Payout"}
          </button>
        </form>
      </div>
    );
  };

  const UserManagement = () => {
    const [newUser, setNewUser] = useState({
      name: "",
      email: "",
      role: "agent",
    });
    const [showForm, setShowForm] = useState(false);

    const canManageUsers =
      currentUser.role === "super_admin" || currentUser.role === "admin";

    const filteredUsers = users.filter((user) => {
      if (currentUser.role === "super_admin") return true;
      if (currentUser.role === "admin")
        return user.parent_id === currentUser.id || user.id === currentUser.id;
      return user.id === currentUser.id;
    });

    const handleCreateUser = (e) => {
      e.preventDefault();
      const user = {
        id: users.length + 1,
        ...newUser,
        wallet_balance: 0,
        parent_id:
          currentUser.role === "super_admin"
            ? newUser.role === "admin"
              ? currentUser.id
              : null
            : currentUser.id,
        kyc_status: "pending",
        created_at: new Date().toISOString(),
      };

      setUsers([...users, user]);
      setNewUser({ name: "", email: "", role: "agent" });
      setShowForm(false);
      alert("User created successfully!");
    };

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-red-700">
            User Management
          </h3>
          {canManageUsers && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200"
            >
              <UserPlus className="h-4 w-4 inline mr-2" />
              Add User
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h4 className="font-semibold mb-4">Create New User</h4>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-red-500 focus:border-red-500"
                required
              />
              <select
                value={newUser.role}
                onChange={(e) =>
                  setNewUser({ ...newUser, role: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-md focus:ring-red-500 focus:border-red-500"
              >
                {currentUser.role === "super_admin" && (
                  <option value="admin">Admin</option>
                )}
                <option value="agent">Agent</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                >
                  Create User
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Wallet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    KYC
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === "super_admin"
                            ? "bg-purple-100 text-purple-800"
                            : user.role === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{user.wallet_balance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.kyc_status === "verified"
                            ? "bg-green-100 text-green-800"
                            : user.kyc_status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {user.kyc_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-red-600 hover:text-red-900 mr-3">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const CommissionSettings = () => {
    const [tempSettings, setTempSettings] = useState(commissionSettings);

    const handleSaveCommission = () => {
      setCommissionSettings(tempSettings);
      alert("Commission settings updated successfully!");
    };

    return (
      <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-6 text-red-700">
          Commission Settings
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Super Admin Commission (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={tempSettings.super_admin}
              onChange={(e) =>
                setTempSettings({
                  ...tempSettings,
                  super_admin: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lowest commission rate for super admin
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Commission (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={tempSettings.admin}
              onChange={(e) =>
                setTempSettings({
                  ...tempSettings,
                  admin: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Commission rate for admins
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Agent Commission (%)
            </label>
            <input
              type="number"
              step="0.1"
              value={tempSettings.agent}
              onChange={(e) =>
                setTempSettings({
                  ...tempSettings,
                  agent: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Highest commission rate for agents
            </p>
          </div>

          <div className="bg-red-50 p-4 rounded-md">
            <h4 className="font-medium text-red-800 mb-2">
              Commission Preview
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Super Admin:</span>
                <span className="font-medium">{tempSettings.super_admin}%</span>
              </div>
              <div className="flex justify-between">
                <span>Admin:</span>
                <span className="font-medium">{tempSettings.admin}%</span>
              </div>
              <div className="flex justify-between">
                <span>Agent:</span>
                <span className="font-medium">{tempSettings.agent}%</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveCommission}
            className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-200"
          >
            Save Commission Settings
          </button>
        </div>
      </div>
    );
  };

  const TransactionHistory = () => {
    const userTransactions = transactions.filter((t) => {
      if (currentUser.role === "super_admin") return true;
      if (currentUser.role === "admin") {
        const agentIds = users
          .filter((u) => u.parent_id === currentUser.id)
          .map((u) => u.id);
        return agentIds.includes(t.user_id) || t.user_id === currentUser.id;
      }
      return t.user_id === currentUser.id;
    });

    const getStatusIcon = (status) => {
      switch (status) {
        case "success":
          return <CheckCircle className="h-4 w-4 text-green-500" />;
        case "failed":
          return <XCircle className="h-4 w-4 text-red-500" />;
        default:
          return <Clock className="h-4 w-4 text-yellow-500" />;
      }
    };

    const getUserName = (userId) => {
      const user = users.find((u) => u.id === userId);
      return user ? user.name : "Unknown User";
    };

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-red-700">
            Transaction History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-red-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                  Date
                </th>
                {currentUser.role !== "agent" && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    User
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                  Commission
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                  ID
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(transaction.created_at).toLocaleDateString()}
                  </td>
                  {currentUser.role !== "agent" && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getUserName(transaction.user_id)}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === "payin"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {transaction.type === "payin" ? (
                        <ArrowUpCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <ArrowDownCircle className="h-3 w-3 mr-1" />
                      )}
                      {transaction.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{transaction.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{(transaction.commission || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(transaction.status)}
                      <span className="ml-2 text-sm capitalize">
                        {transaction.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {transaction.razorpay_order_id ||
                      transaction.razorpay_payout_id}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {userTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No transactions found
            </div>
          )}
        </div>
      </div>
    );
  };

  const Reports = () => {
    const getReportData = () => {
      let reportUsers = [];

      if (currentUser.role === "super_admin") {
        reportUsers = users;
      } else if (currentUser.role === "admin") {
        reportUsers = users.filter(
          (u) => u.parent_id === currentUser.id || u.id === currentUser.id
        );
      } else {
        reportUsers = [currentUser];
      }

      return reportUsers.map((user) => {
        const userTransactions = transactions.filter(
          (t) => t.user_id === user.id
        );
        const payin = userTransactions
          .filter((t) => t.type === "payin" && t.status === "success")
          .reduce((sum, t) => sum + t.amount, 0);
        const payout = userTransactions
          .filter((t) => t.type === "payout" && t.status === "success")
          .reduce((sum, t) => sum + t.amount, 0);
        const commission = userTransactions.reduce(
          (sum, t) => sum + (t.commission || 0),
          0
        );

        return {
          user,
          payin,
          payout,
          commission,
          netBalance: payin - payout,
          transactionCount: userTransactions.length,
        };
      });
    };

    const reportData = getReportData();
    const totals = reportData.reduce(
      (acc, curr) => ({
        payin: acc.payin + curr.payin,
        payout: acc.payout + curr.payout,
        commission: acc.commission + curr.commission,
        users: acc.users + 1,
      }),
      { payin: 0, payout: 0, commission: 0, users: 0 }
    );

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold text-red-700 mb-4">
            Financial Reports
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-600">Total Payin</h4>
              <p className="text-2xl font-bold text-blue-800">
                ₹{totals.payin.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-red-600">Total Payout</h4>
              <p className="text-2xl font-bold text-red-800">
                ₹{totals.payout.toLocaleString()}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-purple-600">
                Total Commission
              </h4>
              <p className="text-2xl font-bold text-purple-800">
                ₹{totals.commission.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-green-600">
                Active Users
              </h4>
              <p className="text-2xl font-bold text-green-800">
                {totals.users}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h4 className="font-semibold text-gray-800">User-wise Report</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-red-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Payin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Payout
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Commission
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Net Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-red-600 uppercase tracking-wider">
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.map((data, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {data.user.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {data.user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          data.user.role === "super_admin"
                            ? "bg-purple-100 text-purple-800"
                            : data.user.role === "admin"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {data.user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      +₹{data.payin.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                      -₹{data.payout.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-medium">
                      ₹{data.commission.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={
                          data.netBalance >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        ₹{data.netBalance.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {data.transactionCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const KYCVerification = () => {
    const [kycData, setKycData] = useState({
      pan: "",
      aadhaar: "",
      bank_account: "",
      ifsc: "",
    });

    const handleKYCSubmit = (e) => {
      e.preventDefault();

      // Update user KYC status
      const updatedUsers = users.map((u) =>
        u.id === currentUser.id ? { ...u, kyc_status: "pending" } : u
      );
      setUsers(updatedUsers);
      setCurrentUser({ ...currentUser, kyc_status: "pending" });

      alert("KYC verification completed successfully!");
    };

    return (
      <div className="max-w-lg mx-auto bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-6 text-red-700">
          KYC Verification
        </h3>

        <div className="mb-4">
          <div
            className={`p-3 rounded-md ${
              currentUser.kyc_status === "verified"
                ? "bg-green-50 border border-green-200"
                : currentUser.kyc_status === "pending"
                ? "bg-yellow-50 border border-yellow-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <p
              className={`text-sm ${
                currentUser.kyc_status === "verified"
                  ? "text-green-800"
                  : currentUser.kyc_status === "pending"
                  ? "text-yellow-800"
                  : "text-red-800"
              }`}
            >
              KYC Status: {currentUser.kyc_status.toUpperCase()}
            </p>
          </div>
        </div>

        {currentUser.kyc_status !== "verified" && (
          <form onSubmit={handleKYCSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PAN Number
              </label>
              <input
                type="text"
                value={kycData.pan}
                onChange={(e) =>
                  setKycData({ ...kycData, pan: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="ABCDE1234F"
                pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aadhaar Number
              </label>
              <input
                type="text"
                value={kycData.aadhaar}
                onChange={(e) =>
                  setKycData({ ...kycData, aadhaar: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="1234 5678 9012"
                pattern="[0-9]{4}[\\s][0-9]{4}[\\s][0-9]{4}"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Account Number
              </label>
              <input
                type="text"
                value={kycData.bank_account}
                onChange={(e) =>
                  setKycData({ ...kycData, bank_account: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="Account Number"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IFSC Code
              </label>
              <input
                type="text"
                value={kycData.ifsc}
                onChange={(e) =>
                  setKycData({ ...kycData, ifsc: e.target.value.toUpperCase() })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                placeholder="HDFC0000001"
                pattern="[A-Z]{4}0[A-Z0-9]{6}"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-200"
            >
              Submit for Verification
            </button>
          </form>
        )}

        {currentUser.kyc_status === "verified" && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-green-800">
              KYC Verified Successfully!
            </h4>
            <p className="text-gray-600">You can now perform payouts</p>
          </div>
        )}
      </div>
    );
  };

  const Sidebar = () => {
    const menuItems = [
      { id: "dashboard", label: "Dashboard", icon: BarChart3 },
      { id: "payin", label: "Add Money", icon: ArrowUpCircle },
      { id: "payout", label: "Withdraw", icon: ArrowDownCircle },
      { id: "transactions", label: "Transactions", icon: FileText },
      { id: "kyc", label: "KYC Verification", icon: Shield },
    ];

    if (currentUser.role !== "agent") {
      menuItems.push(
        { id: "users", label: "User Management", icon: Users },
        { id: "commission", label: "Commission Settings", icon: Percent },
        { id: "reports", label: "Reports", icon: BarChart3 }
      );
    }

    return (
      <div className="bg-red-800 text-white w-64  p-4">
        <div className="mb-8">
          <h2 className="text-xl font-bold">Payment System</h2>
          <p className="text-red-200 text-sm">Powered by Razorpay</p>
        </div>

        <div className="mb-6 p-3 bg-red-700 rounded-lg">
          <div className="flex items-center mb-2">
            <div className="h-8 w-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-sm">{currentUser.name}</p>
              <p className="text-red-200 text-xs capitalize">
                {currentUser.role}
              </p>
            </div>
          </div>
          <div className="text-xs text-red-200">
            Wallet: ₹{currentUser.wallet_balance.toLocaleString()}
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center px-3 py-2 rounded-md text-left transition duration-200 ${
                  activeTab === item.id
                    ? "bg-red-600 text-white"
                    : "text-red-100 hover:bg-red-700"
                }`}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="mt-8 pt-4 border-t border-red-700">
          <button
            onClick={() => setCurrentUser(null)}
            className="w-full flex items-center px-3 py-2 text-red-200 hover:bg-red-700 rounded-md transition duration-200"
          >
            <Settings className="h-4 w-4 mr-3" />
            Logout
          </button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "payin":
        return <PayinComponent />;
      case "payout":
        return <PayoutComponent />;
      case "transactions":
        return <TransactionHistory />;
      case "users":
        return <UserManagement />;
      case "commission":
        return <CommissionSettings />;
      case "reports":
        return <Reports />;
      case "kyc":
        return <KYCVerification />;
      default:
        return <Dashboard />;
    }
  };

  if (!currentUser) {
    return <LoginForm />;
  }

  return (
    <div className="flex bg-gray-100 ">
      <Sidebar />
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">{renderContent()}</div>
      </div>
    </div>
  );
};

export default NotFound;
