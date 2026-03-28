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
  RefreshCw,
  Calendar,
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
import { getDashboard } from "../redux/slices/dashboardSlice";

const Dashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [status, setStatus] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [customDate, setCustomDate] = useState("");

  const { currentUser, isAuthenticated } = useSelector((state) => state.auth);
  const data = useSelector((state) => state.dashboard?.data?.data);

  const summary = data?.summary || {};
  const services = data?.services || [];

  const userRole = currentUser?.role?.name || "USER";

  const userName =
    `${currentUser?.firstName || ""} ${currentUser?.lastName || ""}`.trim() ||
    "User";

  // 🔥 LOAD
  useEffect(() => {
    dispatch(getDashboard({ type: filterType, status }));
  }, [filterType, status]);

  // 🔥 FILTER HANDLER
  const handleFilter = (type) => {
    setFilterType(type);
    setCustomDate("");

    dispatch(getDashboard({ type }));
  };

  const handleCustomDate = (date) => {
    setCustomDate(date);
    setFilterType("custom");

    dispatch(getDashboard({ from: date, to: date }));
  };

  // 🔥 REFRESH
  const handleRefresh = async () => {
    setRefreshing(true);

    if (filterType === "custom" && customDate) {
      await dispatch(getDashboard({ from: customDate, to: customDate }));
    } else {
      await dispatch(getDashboard({ type: filterType }));
    }

    setTimeout(() => setRefreshing(false), 800);
  };

  // 🔥 CALCULATIONS
  const totalTransactions =
    (summary.success || 0) + (summary.failed || 0) + (summary.pending || 0);

  const successRate =
    totalTransactions > 0
      ? ((summary.success / totalTransactions) * 100).toFixed(1)
      : 0;

  // 🔥 CARD GROUPS
  const statCardGroups = [
    {
      title: "Financial Overview",
      icon: Wallet,
      cards: [
        {
          title:
            userRole === "ADMIN" ? "All Users Main Wallet" : "My Main Wallet",
          value: paisaToRupee(summary.totalPrimaryBalance || 0),
          icon: Wallet,
        },
        {
          title:
            userRole === "ADMIN"
              ? "All Users Commission"
              : "My Commission Wallet",
          value: paisaToRupee(summary.totalCommissionBalance || 0),
          icon: Percent,
        },
        {
          title: "Total Volume",
          value: paisaToRupee(summary.totalVolume || 0),
          icon: BarChart3,
        },
        {
          title: "Total Profit",
          value: paisaToRupee(summary.totalProfit || 0),
          icon: TrendingUp,
        },
      ],
    },
    {
      title: "Today",
      icon: Zap,
      cards: [
        {
          title: "Today Revenue",
          value: paisaToRupee(summary.todayRevenue || 0),
          icon: ArrowUpCircle,
        },
        {
          title: "Today Profit",
          value: paisaToRupee(summary.todayProfit || 0),
          icon: TrendingUp,
        },
      ],
    },
    {
      title: "Transactions",
      icon: Activity,
      cards: [
        {
          title: "Success",
          value: summary.success || 0,
          icon: CheckCircle,
        },
        {
          title: "Pending",
          value: summary.pending || 0,
          icon: Clock,
        },
        {
          title: "Failed",
          value: summary.failed || 0,
          icon: XCircle,
        },
      ],
    },
  ];

  // 🔥 TAX (ADMIN ONLY)
  if (summary.totalGST !== undefined) {
    statCardGroups.push({
      title: "Tax",
      icon: Shield,
      cards: [
        {
          title: "GST",
          value: paisaToRupee(summary.totalGST || 0),
          icon: DollarSign,
        },
        {
          title: "TDS",
          value: paisaToRupee(summary.totalTDS || 0),
          icon: DollarSign,
        },
      ],
    });
  }

  // 🔥 SERVICE CARDS
  if (services.length > 0) {
    statCardGroups.push({
      title: "Services",
      icon: BarChart3,
      cards: services.map((s) => ({
        title: s.name,
        value: paisaToRupee(s.total),
        icon: BarChart3,
      })),
    });
  }

  // 🔐 AUTH
  if (!isAuthenticated) return <div>Loading...</div>;

  return (
    <div className="container mx-auto space-y-8">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {userName}</h1>
          <p className="text-sm opacity-80">{userRole} Dashboard</p>
        </div>

        <div className="flex items-center gap-3">
          {/* FILTERS */}
          <button onClick={() => setFilterType("all")}>All</button>
          <button onClick={() => handleFilter("today")}>Today</button>
          <button onClick={() => handleFilter("yesterday")}>Yesterday</button>

          <input
            type="date"
            value={customDate}
            onChange={(e) => handleCustomDate(e.target.value)}
            className="text-black px-2 rounded"
          />

          {/* REFRESH */}
          <button onClick={handleRefresh}>
            <RefreshCw className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* CARDS */}
      {statCardGroups.map((group, i) => (
        <div key={i}>
          <h2 className="text-lg font-bold mb-3">{group.title}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {group.cards.map((card, idx) => (
              <StateCard key={idx} {...card} />
            ))}
          </div>
        </div>
      ))}

      {/* CHART */}
      <DashboardChart />

      {/* ADMIN ACTIONS */}
      {userRole === "ADMIN" && (
        <div className="grid grid-cols-3 gap-4">
          <button onClick={() => navigate("/users")}>Users</button>
          <button onClick={() => navigate("/commission-management")}>
            Commission
          </button>
          <button onClick={() => navigate("/reports")}>Reports</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
