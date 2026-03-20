import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useDispatch, useSelector } from "react-redux";
import { getDashboard } from "../redux/slices/dashboardSlice";
import { Calendar, Filter, TrendingUp, Download, RefreshCw } from "lucide-react";

const DashboardChart = () => {
  const dispatch = useDispatch();

  const { isLoading } = useSelector((s) => s.dashboard);
  const data = useSelector((s) => s.dashboard?.data?.data);

  const chartData = data?.chart || [];

  const [range, setRange] = useState("7d");
  const [status, setStatus] = useState("ALL");
  const [showLegend, setShowLegend] = useState(true);

  useEffect(() => {
    dispatch(getDashboard({ range, status }));
  }, [range, status]);

  const serviceKeys = useMemo(() => {
    if (!chartData.length) return [];

    return Object.keys(chartData[0]).filter(
      (key) => key !== "label" && key !== "total",
    );
  }, [chartData]);

  // Currency formatter
  const formatCurrency = (val) =>
    `₹${(Number(val) / 100).toLocaleString("en-IN")}`;

  // Get status color
  const getStatusColor = (statusValue) => {
    const colors = {
      ALL: "bg-blue-500",
      SUCCESS: "bg-green-500",
      FAILED: "bg-red-500",
      PENDING: "bg-amber-500",
    };
    return colors[statusValue] || "bg-gray-500";
  };

  // Get range label
  const getRangeLabel = (rangeValue) => {
    const labels = {
      "1d": "Today",
      "7d": "Last 7 Days",
      "1m": "Last Month",
      "1y": "Last Year",
      all: "All Time",
    };
    return labels[rangeValue] || rangeValue;
  };

  // Calculate total from chart data
  const totalAmount = useMemo(() => {
    if (!chartData.length) return 0;
    return chartData.reduce((sum, item) => sum + (item.total || 0), 0);
  }, [chartData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-xl shadow-2xl border border-gray-100 p-4 min-w-[200px]">
          <p className="text-sm font-semibold text-gray-800 mb-2 border-b pb-2">
            {label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between items-center gap-4 text-sm mb-1">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600">{entry.name}:</span>
              </div>
              <span className="font-semibold text-gray-800">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Handle export
  const handleExport = () => {
    const csvData = chartData.map(item => ({
      Date: item.label,
      ...serviceKeys.reduce((acc, key) => ({ ...acc, [key]: item[key] }), {}),
      Total: item.total
    }));
    
    const csvString = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard_data_${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle refresh
  const handleRefresh = () => {
    dispatch(getDashboard({ range, status }));
  };

  // Color palette for lines
  const lineColors = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec489a", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
  ];

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-gray-50 via-white to-gray-50 border-b border-gray-100">
        <div className="px-6 py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Transaction Analytics
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  Overview of transactions over time
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Summary Card */}
              {totalAmount > 0 && (
                <div className="hidden md:block px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <p className="text-xs text-gray-500">Total Volume</p>
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(totalAmount)}
                  </p>
                </div>
              )}

              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>

              {/* Export Button */}
              {chartData.length > 0 && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  title="Export as CSV"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline">Export</span>
                </button>
              )}
            </div>
          </div>

          {/* Filters Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Time Range:</span>
              <div className="flex gap-1">
                {["1d", "7d", "1m", "1y", "all"].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                      range === r
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {r === "1d" ? "Today" : r === "7d" ? "7D" : r === "1m" ? "1M" : r === "1y" ? "1Y" : "All"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">Status:</span>
              <div className="flex gap-1">
                {["ALL", "SUCCESS", "FAILED", "PENDING"].map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                      status === s
                        ? `${getStatusColor(s)} text-white shadow-md`
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Legend Toggle */}
            {serviceKeys.length > 0 && (
              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setShowLegend(!showLegend)}
                  className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {showLegend ? "Hide Legend" : "Show Legend"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-6">
        {isLoading ? (
          <div className="h-[400px] flex flex-col items-center justify-center">
            <div className="relative">
              <div className="animate-spin h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-6 w-6 bg-blue-600 rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="mt-4 text-gray-500 text-sm">Loading chart data...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="h-[400px] flex flex-col items-center justify-center">
            <div className="p-4 bg-gray-50 rounded-full mb-4">
              <TrendingUp className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg font-medium">No data available</p>
            <p className="text-gray-400 text-sm mt-1">
              Try adjusting your filters or check back later
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
              <defs>
                <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e5e7eb"
                vertical={false}
              />
              
              <XAxis 
                dataKey="label" 
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              
              <YAxis 
                tickFormatter={formatCurrency}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
              />
              
              <Tooltip content={<CustomTooltip />} />
              
              {showLegend && (
                <Legend 
                  wrapperStyle={{ paddingTop: "20px" }}
                  iconType="circle"
                  iconSize={8}
                />
              )}

              {/* TOTAL LINE with gradient area */}
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                name="Total"
              />
              
              {/* DYNAMIC SERVICE LINES */}
              {serviceKeys.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={lineColors[(idx + 1) % lineColors.length]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 1 }}
                  name={key}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer with metadata */}
      {chartData.length > 0 && !isLoading && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>Range: {getRangeLabel(range)}</span>
              <span>Status: {status === "ALL" ? "All Transactions" : status}</span>
            </div>
            <div>
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardChart;