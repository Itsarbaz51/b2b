import { CreditCard, Eye, CheckCircle, XCircle } from "lucide-react";
import { paisaToRupee } from "../../../utils/lib";
import ActionMenu from "../../ui/ActionMenu";

const getStatusStyle = (status) => {
  switch (status) {
    case "SUCCESS":
      return "bg-green-100 text-green-700 border-green-200";
    case "FAILED":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
  }
};

const FundRequestTable = ({ requests = [], handleAction }) => {
  if (!requests.length) {
    return (
      <div className="text-center py-12">
        <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg mb-2">No payout txn found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          Fund Request History
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Txn ID
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Method
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                RRN / UTR
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Initiated At
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Completed At
              </th>

              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((request) => {
              const isRazorpay =
                request?.serviceProviderMapping?.provider?.code === "RAZORPAY";

              return (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {request.txnId}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-700">
                    {request?.serviceProviderMapping?.service?.code?.replace(
                      "_",
                      " ",
                    )}
                  </td>

                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    ₹{paisaToRupee(request.amount)}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-700 font-mono">
                    {request.providerReference || "-"}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-700">
                    {new Date(request.initiatedAt).toLocaleString()}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-700">
                    {request.completedAt
                      ? new Date(request.completedAt).toLocaleString()
                      : "-"}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusStyle(
                        request.status,
                      )}`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 relative">
                    <ActionMenu
                      items={[
                        {
                          icon: CheckCircle,
                          label:
                            request.status === "PENDING"
                              ? "Check Status"
                              : "Already Checked",
                          disabled: request.status !== "PENDING",
                          onClick: () => {
                            if (request.status === "PENDING") {
                              handleAction("check-status", request);
                            }
                          },
                        },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FundRequestTable;
