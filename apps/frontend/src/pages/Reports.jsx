import { useState } from "react";
import {
  Search,
  Filter,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  FileText,
  BarChart3,
  PieChart,
  Eye,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import StateCard from "../components/ui/StateCard";
import { useSelector } from "react-redux";

const Reports = ({ transactions, users }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const { currentUser } = useSelector((state) => state.auth);

  // Helper function to get role name consistently
  const getRoleName = (role) => {
    if (!role) return "";
    return typeof role === "string" ? role : role?.name || "";
  };

  // Helper function to get role display name
  const getRoleDisplayName = (role) => {
    const roleName = getRoleName(role);

    switch (roleName) {
      case "ADMIN":
        return "Super STATE HEAD";
      case "STATE HEAD":
        return "State Head";
      default:
        return (
          roleName?.charAt(0)?.toUpperCase() +
            roleName?.slice(1)?.toLowerCase() || "User"
        );
    }
  };

  // Helper function to get role color
  const getRoleColor = (role) => {
    const roleName = getRoleName(role);

    switch (roleName) {
      case "ADMIN":
        return "bg-orange-100 text-orange-600 border border-orange-200";
      case "STATE HEAD":
        return "bg-blue-100 text-blue-600 border border-blue-200";
      default:
        return "bg-green-100 text-green-600 border border-green-200";
    }
  };

  const getReportData = () => {
    let reportUsers = [];

    const currentUserRole = getRoleName(currentUser.role);

    if (currentUserRole === "ADMIN") {
      reportUsers = users || [];
    } else if (currentUserRole === "admin") {
      reportUsers = (users || []).filter(
        (u) => u.parent_id === currentUser.id || u.id === currentUser.id
      );
    } else {
      reportUsers = [currentUser];
    }

    return reportUsers.map((user) => {
      const userTransactions = (transactions || []).filter(
        (t) => t.user_id === user.id
      );

      const payin = userTransactions
        .filter((t) => t.type === "payin" && t.status === "success")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const payout = userTransactions
        .filter((t) => t.type === "payout" && t.status === "success")
        .reduce((sum, t) => sum + (t.amount || 0), 0);

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

  const filteredReportData = reportData.filter(
    (data) =>
      data.user.name?.toLowerCase().includes(searchTerm?.toLowerCase()) ||
      data.user.email?.toLowerCase().includes(searchTerm?.toLowerCase())
  );

  const totals = reportData.reduce(
    (acc, curr) => ({
      payin: acc.payin + curr.payin,
      payout: acc.payout + curr.payout,
      commission: acc.commission + curr.commission,
      users: acc.users + 1,
      netBalance: acc.netBalance + curr.netBalance,
    }),
    { payin: 0, payout: 0, commission: 0, users: 0, netBalance: 0 }
  );

  const getInitials = (name) => {
    if (!name) return "UU";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-red-500",
      "bg-yellow-500",
      "bg-indigo-500",
      "bg-pink-500",
      "bg-teal-500",
    ];
    const index = (name?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const statCards = [
    {
      title: "Total Payin",
      value: `₹${totals?.payin.toLocaleString()}`,
      icon: TrendingUp,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      change: "+12.5%",
      changeType: "increase",
    },
    {
      title: "Total Payout",
      value: `₹${totals?.payout.toLocaleString()}`,
      icon: TrendingDown,
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      change: "-2.3%",
      changeType: "decrease",
    },
    {
      title: "Total Commission",
      value: `₹${totals?.commission.toFixed(2)}`,
      icon: DollarSign,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      change: "+8.1%",
      changeType: "increase",
    },
    {
      title: "Active Users",
      value: totals?.users.toString(),
      icon: Users,
      color: "bg-indigo-500",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      change: "+5.2%",
      changeType: "increase",
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        breadcrumb={["Dashboard", "Financial Reports"]}
        title="Financial Reports"
        description="Monitor your financial performance and user analytics"
      />

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <StateCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            iconBg={stat.bgColor}
            iconColor={stat.textColor}
            change={stat.change}
            changeType={stat.changeType}
          />
        ))}
      </div>

      {/* User-wise Report Table */}
      <div className="bg-white rounded-xl border border-gray-300 shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-300">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                User-wise Financial Report
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Detailed breakdown by user
              </p>
            </div>
            <div className="flex gap-3 mt-4 sm:mt-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-300">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  USER DETAILS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ROLE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PAYIN
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  PAYOUT
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  COMMISSION
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NET BALANCE
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  TRANSACTIONS
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReportData.map((data, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className={`h-10 w-10 rounded-full ${getAvatarColor(
                          data.user.name
                        )} flex items-center justify-center text-white font-medium text-sm`}
                      >
                        {getInitials(data.user.name)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {data.user.name || "Unknown User"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {data.user.email || "No email"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
                        data.user.role
                      )}`}
                    >
                      {getRoleDisplayName(data.user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-green-600">
                        +₹{data.payin.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TrendingDown className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm font-medium text-red-600">
                        -₹{data.payout.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-blue-500 mr-2" />
                      <span className="text-sm font-medium text-blue-600">
                        ₹{data.commission.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                        data.netBalance >= 0
                          ? "bg-green-100 text-green-800 border border-green-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      ₹{data.netBalance.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">
                        {data.transactionCount}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button className="text-gray-400 hover:text-blue-600 p-1">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-green-600 p-1">
                        <BarChart3 className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-indigo-600 p-1">
                        <PieChart className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-300 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {filteredReportData.length} of {reportData.length} users
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Profitable Users:{" "}
              {filteredReportData.filter((data) => data.netBalance > 0).length}
            </div>
            <div className="text-sm text-gray-600">
              Loss Users:{" "}
              {filteredReportData.filter((data) => data.netBalance < 0).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
