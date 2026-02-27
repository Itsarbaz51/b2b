// RoleList.js
import { Trash2, Edit2, Users, Shield, TrendingUp } from "lucide-react";

export function RoleList({
  roles,
  onEdit,
  onDelete,
  onPermission,
  type = "employee",
}) {
  // Only allow actions for employee roles
  const allowActions = type === "employee";

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700">
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Role Name
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Level
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
              Description
            </th>
            {allowActions && (
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {roles?.length === 0 ? (
            <tr>
              <td
                colSpan={allowActions ? 5 : 4}
                className="px-6 py-16 text-center"
              >
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full flex items-center justify-center mb-4">
                    <Users size={40} className="text-cyan-500" />
                  </div>
                  <p className="text-lg font-semibold text-gray-600">
                    No roles found
                  </p>
                  <p className="text-sm mt-1">
                    {allowActions
                      ? 'Click "Create Employee Role" to create your first role'
                      : "Business roles are system-managed"}
                  </p>
                </div>
              </td>
            </tr>
          ) : (
            roles?.map((role, idx) => (
              <tr
                key={role.id || idx}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                  {idx + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-semibold text-gray-900">
                    {role.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Type: {role.type || "N/A"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                      Level {role.level}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 max-w-md">
                    {role.description}
                  </div>
                </td>
                {allowActions && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex gap-2">
                      {/* Edit Button */}
                      <button
                        onClick={() => onEdit(role)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>

                      {/* Permission Button */}
                      {/* <button
                        onClick={() => onPermission(role)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-sm"
                      >
                        <Shield size={14} />
                        Permission
                      </button> */}

                      {/* Delete Button */}
                      <button
                        onClick={() => onDelete(role)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all shadow-sm"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
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
}
