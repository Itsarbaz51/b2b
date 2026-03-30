import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  ArrowUpCircle,
  TrendingUp,
  BarChart3,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Percent,
  Shield,
  Zap,
  Users,
  Settings,
  FileText,
  ChevronRight,
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
  const [filterType, setFilterType] = useState("all");
  const [customDate, setCustomDate] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const { currentUser, isAuthenticated } = useSelector((s) => s.auth);
  const { data, isLoading } = useSelector((s) => s.dashboard);

  const dashboard = data?.data || {};
  const summary = dashboard.summary || {};
  const services = dashboard.services || [];

  const userRole = currentUser?.role?.name || "USER";

  //  SINGLE SOURCE FETCH
  useEffect(() => {
    if (filterType === "custom" && customDate) {
      dispatch(getDashboard({ from: customDate, to: customDate, status }));
    } else {
      dispatch(getDashboard({ type: filterType, status }));
    }
  }, [filterType, customDate, status]);

  //  HANDLERS
  const handleFilter = (type) => {
    setFilterType(type);
    setCustomDate("");
  };

  const handleCustomDate = (date) => {
    setCustomDate(date);
    setFilterType("custom");
  };

  const handleRefresh = async () => {
    setRefreshing(true);

    if (filterType === "custom" && customDate) {
      await dispatch(
        getDashboard({ from: customDate, to: customDate, status }),
      );
    } else {
      await dispatch(getDashboard({ type: filterType, status }));
    }

    setRefreshing(false);
  };

  const totalTransactions =
    (summary.success || 0) + (summary.failed || 0) + (summary.pending || 0);

  //  CARD GROUPS
  const statCardGroups = [
    {
      title: "Financial Overview",
      cards: [
        {
          title: userRole === "ADMIN" ? "All Users Wallet" : "My Wallet",
          value: paisaToRupee(summary.totalPrimaryBalance || 0),
          icon: Wallet,
        },
        {
          title: userRole === "ADMIN" ? "All Commission" : "My Commission",
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
      title: "Transactions",
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

  //  TAX
  if (summary.totalGST !== undefined) {
    statCardGroups.push({
      title: "Tax",
      cards: [
        {
          title: userRole === "ADMIN" ? "GST Collected" : "GST Paid",
          value: paisaToRupee(summary.totalGST || 0),
        },
        {
          title: userRole === "ADMIN" ? "TDS Collected" : "TDS Paid",
          value: paisaToRupee(summary.totalTDS || 0),
        },
      ],
    });
  }

  //  SERVICE CARDS
  if (services.length > 0) {
    statCardGroups.push({
      title: "Services",
      icon: BarChart3,
      cards: services.map((s) => ({
        title: `${s.name} (${s.provider})`,
        value: paisaToRupee(s.total),
        icon: BarChart3,
      })),
    });
  }

  if (!isAuthenticated) return <div>Loading...</div>;

  return (
    <div className="container mx-auto space-y-8">
      {/* HEADER */}
      <div className="bg-linear-to-r from-blue-600 to-indigo-700 rounded-3xl p-6 text-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome {currentUser?.firstName || ""}
          </h1>
          <p className="text-sm opacity-80">{userRole} Dashboard</p>
        </div>

        <div className="flex gap-3 items-center">
          <button onClick={() => handleFilter("all")}>All</button>
          <button onClick={() => handleFilter("today")}>Today</button>
          <button onClick={() => handleFilter("yesterday")}>Yesterday</button>

          <input
            type="date"
            value={customDate}
            onChange={(e) => handleCustomDate(e.target.value)}
            className="text-black px-2 rounded"
          />

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
    </div>
  );
};

export default Dashboard;
