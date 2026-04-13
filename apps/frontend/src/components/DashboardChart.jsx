import { useMemo } from "react";
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
import { useSelector } from "react-redux";
import { paisaToRupee } from "../utils/lib";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

const DashboardChart = () => {
  const { data } = useSelector((s) => s.dashboard);
  const chartData = data?.data?.chart || [];

  const formatCurrency = (val) => `₹${paisaToRupee(val)}`;

  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <h3 className="font-bold mb-4">Analytics</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip formatter={(val) => formatCurrency(val)} />
          <Legend />

          <Line dataKey="total" stroke="#1C5BFA" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardChart;
