import { Layers } from "lucide-react";
import { paisaToRupee } from "../../utils/lib";

const ReportTable = ({ data = [], loading }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold">#</th>
            <th className="px-6 py-3 text-left text-xs font-semibold">
              Service
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold">
              Provider
            </th>
            <th className="px-6 py-3 text-left text-xs font-semibold">
              Profit
            </th>
          </tr>
        </thead>

        <tbody className="divide-y">
          {data.map((item, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-6 py-4">{index + 1}</td>

              <td className="px-6 py-4 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                {item.service}
              </td>

              <td className="px-6 py-4">{item.provider}</td>

              <td className="px-6 py-4 font-semibold text-green-600">
                ₹{paisaToRupee(item.profit)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ReportTable;
