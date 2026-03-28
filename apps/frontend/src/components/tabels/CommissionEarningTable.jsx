import { paisaToRupee } from "../../utils/lib";
import EmptyState from "../ui/EmptyState";

const CommissionEarningTable = ({
  earnings = [],
  isLoading = false,
  search = "",
  currentPage = 1,
  limit = 10,
}) => {
  const getModeColor = (mode) => {
    switch (mode) {
      case "COMMISSION":
        return "bg-indigo-100 text-indigo-800 border-indigo-300";
      case "SURCHARGE":
        return "bg-pink-100 text-pink-800 border-pink-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="bg-white w-full rounded-xl h-full shadow-lg border border-gray-300 overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              #
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              Transaction
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              Service
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              User
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              From User
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              Mode
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              Amount
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              Earning
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              Net Amount
            </th>

            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              Date
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan={10}>
                <EmptyState type="loading" />
              </td>
            </tr>
          ) : earnings.length === 0 ? (
            <tr>
              <td colSpan={10}>
                <EmptyState
                  type={search ? "search" : "empty"}
                  search={search}
                />
              </td>
            </tr>
          ) : (
            earnings.map((earning, index) => (
              <tr key={earning.id} className="hover:bg-blue-50 transition-all">
                <td className="px-6 py-5">
                  {(currentPage - 1) * limit + index + 1}
                </td>

                {/* Transaction */}
                <td className="px-6 py-5 text-sm">
                  <div className="font-semibold text-blue-600">
                    {earning.transaction?.txnId || "-"}
                  </div>
                </td>

                {/* Service */}
                <td className="px-6 py-5 text-sm text-gray-700">
                  <div className="font-semibold">
                    {earning.serviceProviderMapping?.service?.name || "-"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {earning.serviceProviderMapping?.service?.code || ""}
                  </div>
                </td>

                {/* User */}
                <td className="px-6 py-5 text-sm text-gray-700">
                  <div className="font-semibold">
                    {earning.user?.username || "-"}
                  </div>
                </td>

                {/* From User */}
                <td className="px-6 py-5 text-sm text-gray-700">
                  {earning.fromUser?.username || "-"}
                </td>

                {/* Mode */}
                <td className="px-6 py-5">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getModeColor(
                      earning.mode,
                    )}`}
                  >
                    {earning.mode}
                  </span>
                </td>

                {/* Amount */}
                <td className="px-6 py-5 text-sm font-semibold">
                  ₹{paisaToRupee(earning.amount)}
                </td>

                {/* Commission / surchage */}
                <td className="px-6 py-5 text-sm font-semibold text-green-600">
                  ₹
                  {earning.mode == "SURCHARGE"
                    ? paisaToRupee(earning.surchargeAmount)
                    : paisaToRupee(earning.commissionAmount)}
                </td>

                {/* Net */}
                <td className="px-6 py-5 text-sm font-semibold text-indigo-600">
                  ₹{paisaToRupee(earning.netAmount)}
                </td>

                {/* Date */}
                <td className="px-6 py-5 text-sm text-gray-600">
                  {new Date(earning.createdAt).toLocaleString()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CommissionEarningTable;
