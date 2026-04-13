import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useSelector } from "react-redux";
import { paisaToRupee } from "../utils/lib";

const TransactionTrendChart = () => {
  const { data } = useSelector((s) => s.dashboard);
  const chartData = data?.data?.chart || [];

  const formatCurrency = (val) => `₹${paisaToRupee(val)}`;

  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <h3 className="font-semibold mb-4">Transaction Trend</h3>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="label" />
          <YAxis tickFormatter={formatCurrency} />

          <Tooltip formatter={(val) => formatCurrency(val)} />

          <Line
            type="monotone"
            dataKey="total"
            stroke="#1C5BFA"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TransactionTrendChart;
