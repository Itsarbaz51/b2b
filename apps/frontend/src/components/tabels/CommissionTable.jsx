import { Edit, X, MoreVertical } from "lucide-react";
import EmptyState from "../ui/EmptyState";
import { useSelector } from "react-redux";

const CommissionTable = ({
  commissions = [],
  isLoading = false,
  search = "",
  currentPage = 1,
  limit = 10,
  onEditCommission,
  onMenuToggle,
  openMenuId,
}) => {
  const getScopeColor = (scope) => {
    switch (scope) {
      case "ROLE":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "USER":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case "PERCENT":
        return "bg-green-100 text-green-800 border-green-300";
      case "FLAT":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const commissionActions = [
    {
      icon: Edit,
      label: "Edit Commission",
      onClick: (commission) => {
        onEditCommission(commission);
        onMenuToggle(null);
      },
      color: "text-blue-600",
    },
  ];

  const { currentUser } = useSelector((state) => state.auth);

  return (
    <div className="bg-white w-full rounded-xl h-full shadow-lg border border-gray-300 overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              #
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              Scope
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              Target
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              Service
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              Type
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              Value
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              Min/Max
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              Surcharge
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
              TDS/GST
            </th>
            {console.log(currentUser.role)}
            {(currentUser.role.name === "ADMIN" ||
              currentUser.role.type === "employee") && (
              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100">
          {isLoading ? (
            <tr>
              <td colSpan={10}>
                <EmptyState type="loading" />
              </td>
            </tr>
          ) : commissions.length === 0 ? (
            <tr>
              <td colSpan={10}>
                <EmptyState
                  type={search ? "search" : "empty"}
                  search={search}
                />
              </td>
            </tr>
          ) : (
            commissions.map((commission, index) => (
              <tr
                key={commission.id}
                className="hover:bg-blue-50 transition-all"
              >
                <td className="px-6 py-5">
                  {(currentPage - 1) * limit + index + 1}
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getScopeColor(
                      commission.scope
                    )}`}
                  >
                    {commission.scope}
                  </span>
                </td>

                <td className="px-6 py-5 text-sm text-gray-700">
                  {commission.scope === "ROLE" ? (
                    <div>
                      <div className="font-semibold">
                        {commission.role?.name || "Unknown Role"}
                      </div>
                      <div className="text-xs text-gray-500">Role-based</div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-semibold">
                        {commission.targetUser?.firstName || "Unknown User"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {commission.targetUser?.email}
                      </div>
                    </div>
                  )}
                </td>

                <td className="px-6 py-5 text-sm text-gray-700">
                  <div className="font-semibold">
                    {commission.service?.name ||
                      commission.service?.type ||
                      "Unknown Service"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {commission.service?.code || "Service"}
                  </div>
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(
                      commission.commissionType
                    )}`}
                  >
                    {commission.commissionType}
                  </span>
                </td>

                <td className="px-6 py-5">
                  <div className="text-sm font-semibold">
                    {commission.commissionType === "PERCENTAGE"
                      ? `${commission.commissionValue}%`
                      : `₹${commission.commissionValue}`}
                  </div>
                </td>

                <td className="px-6 py-5 text-sm text-gray-600">
                  <div className="space-y-1">
                    <div>Min: ₹{commission.minAmount || "0"}</div>
                    <div>Max: ₹{commission.maxAmount || "∞"}</div>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <div className="text-sm font-semibold">
                    {commission.surchargeType === "PERCENTAGE"
                      ? `${commission.surchargeAmount}%`
                      : `₹${commission.surchargeAmount}`}
                  </div>
                </td>

                <td className="px-6 py-5 text-sm text-gray-600">
                  <div className="space-y-1">
                    {commission.applyTDS && (
                      <div>TDS: {commission.tdsPercent}%</div>
                    )}
                    {commission.applyGST && (
                      <div>GST: {commission.gstPercent}%</div>
                    )}
                    {!commission.applyTDS && !commission.applyGST && (
                      <div className="text-gray-400">-</div>
                    )}
                  </div>
                </td>

                {(currentUser.role.name === "ADMIN" ||
                  currentUser.role.type === "employee") && (
                  <td className="px-6 py-5 text-center relative">
                    <div className="inline-block relative">
                      <button
                        className="p-2 rounded-full hover:bg-gray-100"
                        onClick={() =>
                          onMenuToggle(
                            openMenuId === commission.id ? null : commission.id
                          )
                        }
                      >
                        {openMenuId === commission.id ? (
                          <X className="w-5 h-5 text-gray-600" />
                        ) : (
                          <MoreVertical className="w-5 h-5 text-gray-600" />
                        )}
                      </button>

                      {openMenuId === commission.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                          {commissionActions.map((action, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                action.onClick(commission);
                              }}
                              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <action.icon
                                className={`w-4 h-4 mr-3 ${action.color}`}
                              />
                              {action.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CommissionTable;
