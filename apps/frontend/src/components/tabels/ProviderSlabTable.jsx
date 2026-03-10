import { paisaToRupee } from "../../utils/lib";

export default function ProviderSlabTable({ slabs = [], onEdit }) {
  return (
    <div className="overflow-hidden border border-gray-200 rounded-lg">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="px-6 py-3 text-left font-semibold">Min</th>
            <th className="px-6 py-3 text-left font-semibold">Max</th>
            <th className="px-6 py-3 text-left font-semibold">Mode</th>
            <th className="px-6 py-3 text-left font-semibold">Type</th>
            <th className="px-6 py-3 text-left font-semibold">Provider Cost</th>
            <th className="px-6 py-3 text-left font-semibold">Selling Price</th>
            <th className="px-6 py-3 text-center font-semibold">Action</th>
          </tr>
        </thead>

        <tbody>
          {slabs.map((s) => (
            <tr
              key={s.id}
              className="border-t border-gray-200 hover:bg-gray-50"
            >
              <td className="px-6 py-3">₹{paisaToRupee(s.minAmount)}</td>

              <td className="px-6 py-3">₹{paisaToRupee(s.maxAmount)}</td>

              <td className="px-6 py-3">{s.mode}</td>

              <td className="px-6 py-3">{s.pricingValueType}</td>

              <td className="px-6 py-3 text-red-500 font-medium">
                ₹{paisaToRupee(s.providerCost)}
              </td>

              <td className="px-6 py-3 text-green-600 font-medium">
                ₹{paisaToRupee(s.sellingPrice)}
              </td>

              <td className="px-6 py-3 text-center">
                <button
                  onClick={() => onEdit(s)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs font-medium"
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
