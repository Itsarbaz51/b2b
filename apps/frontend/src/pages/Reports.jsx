import {  useState } from "react";


export default function ReportDashboard() {
  const [summary, setSummary] = useState(null);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);






  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* 🔥 SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card title="Commission" value={summary?.commission || summary?.totalCommission} />
        <Card title="Surcharge" value={summary?.surcharge || summary?.totalSurcharge} />
        <Card title="GST" value={summary?.gst || summary?.totalGST} />
        <Card title="TDS" value={summary?.tds || summary?.totalTDS} />
        <Card title="Net Profit" value={summary?.netProfit} highlight />
      </div>

      {/* 🔥 SERVICE TABLE */}
      <div className="bg-white rounded-2xl shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Service Wise Report</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Service</th>
                <th className="p-2">Provider</th>
                <th className="p-2">Commission</th>
                <th className="p-2">Surcharge</th>
                <th className="p-2">GST</th>
                <th className="p-2">TDS</th>
                <th className="p-2">Profit</th>
              </tr>
            </thead>

            <tbody>
              {services.map((s, i) => {
                const profit =
                  s.commission + s.surcharge - s.gst - s.tds;

                return (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    <td className="p-2">{s.service}</td>
                    <td className="p-2">{s.provider}</td>
                    <td className="p-2 text-green-600">{s.commission}</td>
                    <td className="p-2 text-blue-600">{s.surcharge}</td>
                    <td className="p-2 text-red-500">{s.gst}</td>
                    <td className="p-2 text-red-500">{s.tds}</td>
                    <td className="p-2 font-semibold">{profit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* 🔥 CARD COMPONENT */
function Card({ title, value, highlight }) {
  return (
    <div
      className={`p-4 rounded-2xl shadow bg-white ${
        highlight ? "border-2 border-green-500" : ""
      }`}
    >
      <p className="text-sm text-gray-500">{title}</p>
      <h2 className="text-xl font-bold mt-1">₹ {value || 0}</h2>
    </div>
  );
}