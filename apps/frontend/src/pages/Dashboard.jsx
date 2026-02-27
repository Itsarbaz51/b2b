import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  UserPlus,
  Percent,
  BarChart3,
} from "lucide-react";
import HeaderSection from "../components/ui/HeaderSection";
import StateCard from "../components/ui/StateCard";
import { useSelector } from "react-redux";

// Dummy data for development/testing
const DUMMY_DATA = {
  transactions: [
    {
      id: 1,
      userId: 1,
      type: "payin",
      amount: 500000, // ₹5,000.00 (in paise)
      status: "success",
      commission: 2500, // ₹25.00
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      userId: 2,
      type: "payout",
      amount: 300000, // ₹3,000.00
      status: "success",
      commission: 1500, // ₹15.00
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      userId: 1,
      type: "payin",
      amount: 750000, // ₹7,500.00
      status: "success",
      commission: 3750, // ₹37.50
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      userId: 3,
      type: "payout",
      amount: 200000, // ₹2,000.00
      status: "failed",
      commission: 0,
      createdAt: new Date().toISOString(),
    },
  ],
  users: [
    {
      id: 1,
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      role: "admin",
      parentId: null,
      wallets: [{ balance: 1250000 }], // ₹12,500.00
    },
    {
      id: 2,
      firstName: "Jane",
      lastName: "Smith",
      email: "jane@example.com",
      role: "agent",
      parentId: 1,
      wallets: [{ balance: 500000 }], // ₹5,000.00
    },
    {
      id: 3,
      firstName: "Bob",
      lastName: "Johnson",
      email: "bob@example.com",
      role: "user",
      parentId: 2,
      wallets: [{ balance: 250000 }], // ₹2,500.00
    },
  ],
  commissionSettings: [
    {
      id: 1,
      level: "admin",
      type: "percentage",
      value: 0.5, // 0.5%
      minAmount: 100000, // ₹1,000.00
      maxAmount: 10000000, // ₹100,000.00
    },
    {
      id: 2,
      level: "agent",
      type: "percentage",
      value: 0.3, // 0.3%
      minAmount: 100000,
      maxAmount: 5000000, // ₹50,000.00
    },
  ],
};

const Dashboard = ({
  transactions = DUMMY_DATA.transactions,
  users = DUMMY_DATA.users,
  commissionSettings = DUMMY_DATA.commissionSettings,
}) => {
  const navigate = useNavigate();

  // Get current user from Redux store
  const { currentUser, isAuthenticated } = useSelector((state) => state.auth);

  // Safe data extraction with fallbacks
  const userData = currentUser || users[0]; // Fallback to first dummy user if no currentUser
  const userRole = userData.role?.name || userData.role || "user";
  const userName =
    `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "User";
  const walletBalance = userData.wallets?.[0]?.balance || 0;

  const getUserStats = () => {
    // If no current user in Redux, use the dummy user data
    const effectiveUser = currentUser || userData;

    const userTransactions = transactions.filter((t) => {
      if (userRole === "ADMIN" || userRole === "admin") {
        const agentIds = users
          .filter((u) => u.parentId === effectiveUser.id)
          .map((u) => u.id);
        return agentIds.includes(t.userId) || t.userId === effectiveUser.id;
      }
      return t.userId === effectiveUser.id;
    });

    const totalPayin = userTransactions
      .filter((t) => t.type === "payin" && t.status === "success")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalPayout = userTransactions
      .filter((t) => t.type === "payout" && t.status === "success")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

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

  const formatCurrency = (amountInPaise) => {
    return `₹${amountInPaise.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const statCards = [
    {
      title: "Wallet Balance",
      value: formatCurrency(walletBalance),
      subText: "Available funds",
      icon: Wallet,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      title: "Total Payin",
      value: formatCurrency(stats.totalPayin),
      subText: "Money received",
      icon: ArrowUpCircle,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Payout",
      value: formatCurrency(stats.totalPayout),
      subText: "Money sent",
      icon: ArrowDownCircle,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Commission Earned",
      value: formatCurrency(stats.totalCommission),
      subText: "Total earnings",
      icon: DollarSign,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  // Get managed users count
  const getManagedUsersCount = () => {
    const effectiveUser = currentUser || userData;

    if (userRole === "ADMIN" || userRole === "admin") {
      return users.filter((u) => u.parentId === effectiveUser.id).length;
    }
    return 0;
  };

  // Show loading state if not authenticated (optional - you might want to redirect instead)
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <HeaderSection
        title={`Welcome back, ${userName}`}
        tagLine={`${
          userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase()
        } Dashboard`}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <StateCard key={idx} {...card} />
        ))}
      </div>

      {/* Quick Actions Section */}
      {(userRole === "ADMIN" || userRole === "admin") && (
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800">Quick Actions</h3>
            <div className="text-sm text-gray-500">Manage your platform</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <button
              onClick={() => navigate("/users")}
              className="group flex items-center justify-center p-6 bg-gradient-to-br from-teal-50 to-cyan-50 hover:from-teal-100 hover:to-cyan-100 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-teal-100"
            >
              <div className="flex items-center">
                <div className="bg-teal-100 group-hover:bg-teal-200 p-3 rounded-full mr-4 transition-colors duration-300">
                  <UserPlus className="h-6 w-6 text-teal-600" />
                </div>
                <div className="text-left">
                  <span className="block text-teal-700 font-semibold">
                    Manage Users
                  </span>
                  <span className="block text-teal-500 text-sm">
                    Add & edit users
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/commission")}
              className="group flex items-center justify-center p-6 bg-gradient-to-br from-violet-50 to-purple-50 hover:from-violet-100 hover:to-purple-100 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-violet-100"
            >
              <div className="flex items-center">
                <div className="bg-violet-100 group-hover:bg-violet-200 p-3 rounded-full mr-4 transition-colors duration-300">
                  <Percent className="h-6 w-6 text-violet-600" />
                </div>
                <div className="text-left">
                  <span className="block text-violet-700 font-semibold">
                    Commission Settings
                  </span>
                  <span className="block text-violet-500 text-sm">
                    Configure rates
                  </span>
                </div>
              </div>
            </button>

            <button
              onClick={() => navigate("/reports")}
              className="group flex items-center justify-center p-6 bg-gradient-to-br from-emerald-50 to-green-50 hover:from-emerald-100 hover:to-green-100 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg border border-emerald-100"
            >
              <div className="flex items-center">
                <div className="bg-emerald-100 group-hover:bg-emerald-200 p-3 rounded-full mr-4 transition-colors duration-300">
                  <BarChart3 className="h-6 w-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <span className="block text-emerald-700 font-semibold">
                    View Reports
                  </span>
                  <span className="block text-emerald-500 text-sm">
                    Analytics & insights
                  </span>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Recent Activity Summary */}
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          Activity Summary
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-700">
              {stats.transactionCount}
            </p>
            <p className="text-sm text-gray-600">Total Transactions</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-700">
              {getManagedUsersCount()}
            </p>
            <p className="text-sm text-gray-600">Managed Users</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-700">
              {(
                (stats.totalCommission / Math.max(stats.totalPayin, 1)) *
                100
              ).toFixed(1)}
              %
            </p>
            <p className="text-sm text-gray-600">Commission Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
