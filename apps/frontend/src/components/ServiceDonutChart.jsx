import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useSelector } from "react-redux";

const COLORS = [
  "#6366f1",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
];

const ServiceDonutChart = () => {
  const { data } = useSelector((s) => s.dashboard);
  const services = data?.data?.services || [];

  const chartData = services.map((s) => ({
    name: `${s.name}`,
    value: s.total,
  }));

  return (
    <div className="bg-white rounded-2xl p-4 shadow">
      <h3 className="font-semibold mb-4">Service Distribution</h3>

      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            innerRadius={60}
            outerRadius={90}
            dataKey="value"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip formatter={(v) => `₹${v / 100}`} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ServiceDonutChart;
