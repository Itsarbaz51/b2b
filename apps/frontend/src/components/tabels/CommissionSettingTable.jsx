import { Edit, X, MoreVertical, Plus } from "lucide-react";
import EmptyState from "../ui/EmptyState";
import { useSelector } from "react-redux";
import { paisaToRupee } from "../../utils/lib";
import { useState } from "react";
const MAX_VISIBLE = 2;
const CommissionSettingTable = ({
  commissions = [],
  onAddSlab,
  onEditSlab,
  isLoading = false,
  search = "",
  currentPage = 1,
  limit = 10,
  onEditCommission,
  onMenuToggle,
  openMenuId,
  onAddPaymentMethod,
  onEditPaymentMethod,
}) => {
  const [viewModal, setViewModal] = useState({
    open: false,
    type: null,
    commission: null,
  });
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
      case "PERCENTAGE":
        return "bg-green-100 text-green-800 border-green-300";
      case "FLAT":
        return "bg-orange-100 text-orange-800 border-orange-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  const getCommissionActions = (commission) => {
    const actions = [
      {
        icon: Edit,
        label: "Edit Commission",
        onClick: (commission) => {
          onEditCommission(commission);
          onMenuToggle(null);
        },
      },
    ];
    if (commission?.supportsSlab) {
      actions.push({
        icon: Plus,
        label: "Add Slab",
        onClick: (commission) => onAddSlab?.(commission),
        color: "text-green-600",
      });
    }

    if (commission?.supportPaymentMethod) {
      actions.push({
        icon: Plus,
        label: "Add Payment Method",
        onClick: (commission) => onAddPaymentMethod?.(commission),
        color: "text-purple-600",
      });
    }

    return actions;
  };

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
              Mode
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
              TDS/GST
            </th>
            {(currentUser?.role?.name === "ADMIN" ||
              currentUser?.role?.type === "employee") && (
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
                      commission.scope,
                    )}`}
                  >
                    {commission.scope}
                  </span>
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${
                      commission.mode === "COMMISSION"
                        ? "bg-indigo-100 text-indigo-800 border-indigo-300"
                        : "bg-pink-100 text-pink-800 border-pink-300"
                    }`}
                  >
                    {commission.mode}
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
                    {commission.serviceProviderMapping?.service?.name ||
                      "Unknown Service"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {commission.serviceProviderMapping?.service?.code || "-"}
                  </div>
                </td>

                <td className="px-6 py-5">
                  <span
                    className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(
                      commission.type,
                    )}`}
                  >
                    {commission.type}
                    {commission.supportsSlab && (
                      <span className="ml-2 bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        SLAB
                      </span>
                    )}
                  </span>
                </td>

                <td className="px-6 py-5">
                  {/* 🔥 SLAB FIRST */}
                  {commission.supportsSlab &&
                  commission.commissionSlabs?.length > 0 ? (
                    <div className="space-y-1 text-xs">
                      {commission.commissionSlabs
                        .slice(0, MAX_VISIBLE)
                        .map((slab) => (
                          <div
                            key={slab.id}
                            className="bg-gray-100 px-2 py-1 rounded flex justify-between items-center"
                          >
                            <span>
                              ₹{paisaToRupee(slab.minAmount)} - ₹
                              {paisaToRupee(slab.maxAmount)}
                            </span>

                            <span className="font-semibold text-blue-600">
                              {commission.type === "FLAT"
                                ? `₹${paisaToRupee(slab.value)}`
                                : `${paisaToRupee(slab.value)}%`}
                            </span>
                            <button
                              onClick={() => onEditSlab?.(commission, slab)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Edit size={14} />
                            </button>
                          </div>
                        ))}

                      {commission.commissionSlabs.length > MAX_VISIBLE && (
                        <button
                          onClick={() =>
                            setViewModal({
                              open: true,
                              type: "SLAB",
                              commission,
                            })
                          }
                          className="text-blue-600 text-xs font-semibold hover:underline"
                        >
                          View All ({commission.commissionSlabs.length})
                        </button>
                      )}
                    </div>
                  ) : commission.commissionPaymentMethods &&
                    commission.commissionPaymentMethods?.length > 0 ? (
                    <div className="space-y-1 text-xs">
                      {commission.commissionPaymentMethods
                        .slice(0, MAX_VISIBLE)
                        .map((pm) => (
                          <div
                            key={pm.id}
                            className="bg-purple-50 px-2 py-1 rounded flex justify-between items-center"
                          >
                            <span>
                              {commission.serviceProviderMapping?.service
                                ?.code === "BBPS"
                                ? `${pm.category}${pm.operator ? ` - ${pm.operator}` : ""}`
                                : `${pm.paymentMethod}${pm.network ? ` (${pm.network})` : ""}`}
                            </span>

                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-purple-600">
                                {pm.type === "FLAT"
                                  ? `₹${paisaToRupee(pm.value)}`
                                  : `${Number(pm.value) / 100}%`}
                              </span>

                              <button
                                onClick={() =>
                                  onEditPaymentMethod?.(commission, pm)
                                }
                                className="text-blue-500 hover:text-blue-700"
                              >
                                <Edit size={14} />
                              </button>
                            </div>
                          </div>
                        ))}

                      {commission.commissionPaymentMethods.length >
                        MAX_VISIBLE && (
                        <button
                          onClick={() =>
                            setViewModal({
                              open: true,
                              type: "PAYMENT",
                              commission,
                            })
                          }
                          className="text-purple-600 text-xs font-semibold hover:underline"
                        >
                          View All ({commission.commissionPaymentMethods.length}
                          )
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm font-semibold mb-1">
                      {commission.type === "PERCENTAGE"
                        ? `${paisaToRupee(commission.value)}%`
                        : `₹${paisaToRupee(commission.value)}`}
                    </div>
                  )}
                </td>
                <td className="px-6 py-5 text-sm text-gray-600">
                  <div className="space-y-1">
                    {commission.mode === "COMMISSION" &&
                      commission.applyTDS && (
                        <div>TDS: {commission.tdsPercent}%</div>
                      )}

                    {commission.mode === "SURCHARGE" && commission.applyGST && (
                      <div>GST: {commission.gstPercent}%</div>
                    )}

                    {!commission.applyTDS && !commission.applyGST && (
                      <div className="text-gray-400">-</div>
                    )}
                  </div>
                </td>

                {(currentUser?.role?.name === "ADMIN" ||
                  currentUser?.role?.type === "employee") && (
                  <td className="px-6 py-5 text-center relative">
                    <div className="inline-block relative">
                      <button
                        className="p-2 rounded-full hover:bg-gray-100"
                        onClick={() =>
                          onMenuToggle(
                            openMenuId === commission.id ? null : commission.id,
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
                          {getCommissionActions(commission).map(
                            (action, index) => (
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
                            ),
                          )}
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
      {viewModal.open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {viewModal.type === "SLAB"
                  ? "All Slabs"
                  : "All Payment Methods"}
              </h2>

              <button
                onClick={() =>
                  setViewModal({ open: false, type: null, commission: null })
                }
              >
                <X />
              </button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {viewModal.type === "SLAB"
                ? viewModal.commission.commissionSlabs.map((slab) => (
                    <div
                      key={slab.id}
                      className="bg-gray-100 p-2 rounded flex justify-between"
                    >
                      <span>
                        ₹{paisaToRupee(slab.minAmount)} - ₹
                        {paisaToRupee(slab.maxAmount)}
                      </span>

                      <span className="font-semibold">
                        {viewModal.commission.type === "FLAT"
                          ? `₹${paisaToRupee(slab.value)}`
                          : `${paisaToRupee(slab.value)}%`}
                      </span>
                      <button
                        onClick={() => onEditSlab?.(viewModal.commission, slab)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  ))
                : viewModal.commission.commissionPaymentMethods.map((pm) => (
                    <div
                      key={pm.id}
                      className="bg-purple-50 p-2 rounded flex justify-between"
                    >
                      <span>
                        {viewModal.commission.serviceProviderMapping?.service
                          ?.code === "BBPS"
                          ? `${pm.category}${pm.operator ? ` - ${pm.operator}` : ""}`
                          : `${pm.paymentMethod}${pm.network ? ` (${pm.network})` : ""}`}
                      </span>

                      <span className="font-semibold">
                        {pm.type === "FLAT"
                          ? `₹${paisaToRupee(pm.value)}`
                          : `${paisaToRupee(pm.value)}%`}
                      </span>
                      <button
                        onClick={() =>
                          onEditPaymentMethod?.(viewModal.commission, pm)
                        }
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionSettingTable;
