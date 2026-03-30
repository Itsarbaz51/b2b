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
import { RefreshCw } from "lucide-react";

const DashboardChart = () => {
  const dispatch = useDispatch();

  const { data, isLoading } = useSelector((s) => s.dashboard);
  const chartData = data?.data?.chart || [];

  const [type, setType] = useState("today");
  const [status, setStatus] = useState("ALL");

  // 🔥 FETCH
  useEffect(() => {
    dispatch(getDashboard({ type, status }));
  }, [type, status]);

  const formatCurrency = (val) =>
    `₹${(Number(val) / 100).toLocaleString("en-IN")}`;

  const serviceKeys = useMemo(() => {
    if (!chartData.length) return [];
    return Object.keys(chartData[0]).filter(
      (k) => k !== "label" && k !== "total",
    );
  }, [chartData]);

  const handleRefresh = () => {
    dispatch(getDashboard({ type, status }));
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <div className="flex justify-between mb-4">
        <h3 className="font-bold">Analytics</h3>

        <div className="flex gap-2">
          <button onClick={() => setType("today")}>Today</button>
          <button onClick={() => setType("yesterday")}>Yesterday</button>

          <button onClick={handleRefresh}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip />

          <Line dataKey="total" stroke="#3b82f6" />

          {serviceKeys.map((key, i) => (
            <Line
              key={key}
              dataKey={key}
              stroke={["#10b981", "#f59e0b", "#ef4444"][i % 3]}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardChart;
