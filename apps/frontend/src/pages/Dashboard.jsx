import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Percent,
  BarChart3,
  Users,
  Settings,
  FileText,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Download,
  Calendar,
  Filter,
  ChevronRight,
  Sparkles,
  Zap,
  Shield,
  Award,
} from "lucide-react";

import StateCard from "../components/ui/StateCard";
import DashboardChart from "../components/DashboardChart";

import { useDispatch, useSelector } from "react-redux";
import { paisaToRupee } from "../utils/lib";
import HeaderSection from "../components/ui/HeaderSection";
import { getDashboard } from "../redux/slices/dashboardSlice";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState("7d");

  const { currentUser, isAuthenticated } = useSelector((state) => state.auth);
  const { isLoading } = useSelector((state) => state.dashboard);
  const data = useSelector((state) => state.dashboard?.data?.data);

  const summary = data?.summary || {};
  const services = data?.services || [];

  const userData = currentUser || {};
  const userRole = userData.role?.name || userData.role || "USER";

  const userName =
    `${userData.firstName || ""} ${userData.lastName || ""}`.trim() || "User";

  // Helper function to determine card gradient based on title
  const getCardGradient = (title) => {
    const gradients = {
      "Primary Balance": "from-blue-600 to-blue-700",
      "Commission Balance": "from-purple-600 to-purple-700",
      "Today Earning": "from-emerald-600 to-emerald-700",
      "Today Expense": "from-rose-600 to-rose-700",
      "Total Pending": "from-amber-600 to-amber-700",
      "Total Success": "from-green-600 to-green-700",
      "Total Failed": "from-red-600 to-red-700",
      "GST Balance": "from-indigo-600 to-indigo-700",
      "TDS Balance": "from-cyan-600 to-cyan-700",
    };
    return gradients[title] || "from-gray-600 to-gray-700";
  };

  // Helper function to get icon color based on card type
  const getIconColor = (title) => {
    const colors = {
      "Primary Balance": "text-blue-700",
      "Commission Balance": "text-purple-700",
      "Today Earning": "text-emerald-700",
      "Today Expense": "text-rose-700",
      "Total Pending": "text-amber-700",
      "Total Success": "text-green-700",
      "Total Failed": "text-red-700",
      "GST Balance": "text-indigo-700",
      "TDS Balance": "text-cyan-700",
    };
    return colors[title] || "text-gray-100";
  };

  // Calculate totals for summary section
  const totalTransactions =
    (summary.success || 0) + (summary.failed || 0) + (summary.pending || 0);
  const successRate =
    totalTransactions > 0
      ? (((summary.success || 0) / totalTransactions) * 100).toFixed(1)
      : 0;

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await dispatch(getDashboard({ range: selectedTimeframe, status: "ALL" }));
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Handle timeframe change
  const handleTimeframeChange = (timeframe) => {
    setSelectedTimeframe(timeframe);
    dispatch(getDashboard({ range: timeframe, status: "ALL" }));
  };

  // BASE CARDS with enhanced grouping
  const statCardGroups = [
    {
      title: "Financial Overview",
      icon: Wallet,
      color: "blue",
      cards: [
        {
          title: "Primary Balance",
          value: paisaToRupee(summary.totalPrimaryBalance || 0),
          icon: Wallet,
          gradient: getCardGradient("Primary Balance"),
          iconColor: getIconColor("Primary Balance"),
          trend: "+8.5%",
          trendUp: true,
        },
        {
          title: "Commission Balance",
          value: paisaToRupee(summary.totalCommissionBalance || 0),
          icon: Percent,
          gradient: getCardGradient("Commission Balance"),
          iconColor: getIconColor("Commission Balance"),
          trend: "+5.2%",
          trendUp: true,
        },
      ],
    },
    {
      title: "Today's Activity",
      icon: Zap,
      color: "amber",
      cards: [
        {
          title: "Today Earning",
          value: paisaToRupee(summary.todayTotalEarning || 0),
          icon: ArrowUpCircle,
          gradient: getCardGradient("Today Earning"),
          iconColor: getIconColor("Today Earning"),
          trend: "+23%",
          trendUp: true,
          subtitle: "vs yesterday",
        },
        {
          title: "Today Expense",
          value: paisaToRupee(summary.todayTotalExpenses || 0),
          icon: ArrowDownCircle,
          gradient: getCardGradient("Today Expense"),
          iconColor: getIconColor("Today Expense"),
          trend: "-5%",
          trendUp: false,
          subtitle: "vs yesterday",
        },
      ],
    },
    {
      title: "Transaction Statistics",
      icon: Activity,
      color: "green",
      cards: [
        {
          title: "Pending",
          value: summary.pending || 0,
          icon: Clock,
          gradient: getCardGradient("Total Pending"),
          iconColor: getIconColor("Total Pending"),
          isCount: true,
          subtitle: "Awaiting confirmation",
        },
        {
          title: "Success",
          value: summary.success || 0,
          icon: CheckCircle,
          gradient: getCardGradient("Total Success"),
          iconColor: getIconColor("Total Success"),
          isCount: true,
          subtitle: "Completed transactions",
        },
        {
          title: "Failed",
          value: summary.failed || 0,
          icon: XCircle,
          gradient: getCardGradient("Total Failed"),
          iconColor: getIconColor("Total Failed"),
          isCount: true,
          subtitle: "Failed attempts",
        },
      ],
    },
  ];

  // Success Rate Card (Special)
  if (totalTransactions > 0) {
    statCardGroups.push({
      title: "Performance",
      icon: Award,
      color: "purple",
      cards: [
        {
          title: "Success Rate",
          value: `${successRate}%`,
          icon: TrendingUp,
          gradient: "from-purple-600 to-pink-600",
          iconColor: "text-purple-700",
          isPercentage: true,
          subtitle: `${summary.success || 0} of ${totalTransactions} successful`,
        },
      ],
    });
  }

  // ADMIN EXTRA (GST + TDS)
  if (summary.totalGSTBalance !== undefined) {
    statCardGroups.push({
      title: "Tax Management",
      icon: Shield,
      color: "indigo",
      cards: [
        {
          title: "GST Balance",
          value: paisaToRupee(summary.totalGSTBalance),
          icon: DollarSign,
          gradient: getCardGradient("GST Balance"),
          iconColor: getIconColor("GST Balance"),
        },
        {
          title: "TDS Balance",
          value: paisaToRupee(summary.totalTDSBalance),
          icon: DollarSign,
          gradient: getCardGradient("TDS Balance"),
          iconColor: getIconColor("TDS Balance"),
        },
      ],
    });
  }

  // DYNAMIC SERVICES (AUTO SCALE)
  if (services.length > 0) {
    const serviceGradients = [
      "from-teal-600 to-teal-700",
      "from-orange-600 to-orange-700",
      "from-pink-600 to-pink-700",
      "from-violet-600 to-violet-700",
    ];

    statCardGroups.push({
      title: "Service Performance",
      icon: BarChart3,
      color: "teal",
      cards: services.map((s, index) => ({
        title: s.name,
        value: paisaToRupee(s.total),
        icon: BarChart3,
        gradient: serviceGradients[index % serviceGradients.length],
        iconColor: "text-gray-700",
        subtitle: "Total volume",
      })),
    });
  }

  // AUTH CHECK
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
        <div className="relative">
          <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto space-y-8">
        {/* Enhanced Header with quick actions */}
        <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-3xl shadow-2xl">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-20 rounded-full -ml-24 -mb-24"></div>

          <div className="relative px-8 py-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-blue-400" />
                  <h1 className="text-3xl lg:text-4xl font-bold text-white">
                    Welcome back, {userName}
                  </h1>
                </div>
                <p className="text-slate-300 text-lg">
                  {userRole} Dashboard • Last updated:{" "}
                  {new Date().toLocaleString()}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg">
                    <Activity className="h-4 w-4 text-green-400" />
                    <span className="text-white text-sm font-medium">Live</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg">
                    <Calendar className="h-4 w-4 text-blue-400" />
                    <span className="text-white text-sm">
                      {selectedTimeframe === "7d"
                        ? "Last 7 Days"
                        : selectedTimeframe === "1m"
                          ? "Last Month"
                          : "Custom"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Timeframe Selector */}
                <div className="flex gap-2 bg-white/10 backdrop-blur-sm rounded-xl p-1">
                  {["1d", "7d", "1m", "1y"].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => handleTimeframeChange(tf)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedTimeframe === tf
                          ? "bg-white text-slate-900 shadow-lg"
                          : "text-white hover:bg-white/20"
                      }`}
                    >
                      {tf === "1d"
                        ? "Today"
                        : tf === "7d"
                          ? "7D"
                          : tf === "1m"
                            ? "1M"
                            : "1Y"}
                    </button>
                  ))}
                </div>

                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl text-white hover:bg-white/20 transition-all duration-200 disabled:opacity-50"
                >
                  <RefreshCw
                    className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards Grid with enhanced grouping */}
        {statCardGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-5">
            {/* Group Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${group.color}-100 rounded-xl`}>
                  {group.icon && (
                    <group.icon className={`h-5 w-5 text-${group.color}-600`} />
                  )}
                </div>
                <h2 className="text-xl font-bold text-slate-800">
                  {group.title}
                </h2>
                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                  {group.cards.length} items
                </span>
              </div>
              {group.cards.length > 4 && (
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                  View All <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {group.cards.map((card, idx) => (
                <div
                  key={idx}
                  className="transform transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl animate-fadeInUp"
                  style={{
                    animationDelay: `${(gIdx * group.cards.length + idx) * 0.03}s`,
                  }}
                >
                  <StateCard {...card} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Chart Section with enhanced container */}
        <DashboardChart />

        {/* Optional Actions (Admin Only) with enhanced design */}
        {userRole === "ADMIN" && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 transition-all duration-300 hover:shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-100 bg-linear-to-r from-slate-50 to-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-xl">
                  <Zap className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Quick Actions
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Administrative tools and shortcuts for efficient management
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    icon: Users,
                    label: "Manage Users",
                    desc: "Add, edit, or remove users",
                    path: "/users",
                    color: "blue",
                  },
                  {
                    icon: Settings,
                    label: "Commission Settings",
                    desc: "Configure rates and rules",
                    path: "/commission-management",
                    color: "purple",
                  },
                  {
                    icon: FileText,
                    label: "Reports",
                    desc: "Generate and export reports",
                    path: "/reports",
                    color: "green",
                  },
                ].map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(action.path)}
                    className="group relative overflow-hidden bg-linear-to-r from-slate-50 to-white border-2 border-slate-200 hover:border-transparent rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                  >
                    <div
                      className={`absolute inset-0 bg-linear-to-r from-${action.color}-500 to-${action.color}-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                    ></div>
                    <div className="relative flex items-center gap-4">
                      <div
                        className={`p-3 bg-${action.color}-50 rounded-xl group-hover:bg-white/20 transition-all duration-300`}
                      >
                        <action.icon
                          className={`h-6 w-6 text-${action.color}-600 group-hover:text-white`}
                        />
                      </div>
                      <div className="text-left">
                        <p
                          className={`font-semibold text-slate-800 group-hover:text-white transition-colors duration-300`}
                        >
                          {action.label}
                        </p>
                        <p
                          className={`text-sm text-slate-500 group-hover:text-white/80 transition-colors duration-300`}
                        >
                          {action.desc}
                        </p>
                      </div>
                      <ChevronRight
                        className={`h-5 w-5 text-slate-400 group-hover:text-white ml-auto transition-all duration-300 group-hover:translate-x-1`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add custom animations */}
        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeInUp {
            animation: fadeInUp 0.5s ease-out forwards;
          }
        `}</style>
      </div>
    </div>
  );
};

export default Dashboard;
