import { Trash2, Edit2, Users, Shield, TrendingUp } from "lucide-react";
import EmptyState from "../components/ui/EmptyState";

export function RoleList({
  roles,
  onEdit,
  onDelete,
  onPermission,
  type = "employee",
}) {
  // Edit/Delete only for employee roles
  const allowActions = type === "employee";

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-700">
            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
              #
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
              Role Name
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
              Level
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
              Description
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase">
              Actions
            </th>
          </tr>
        </thead>

        <tbody className="bg-white divide-y divide-gray-100">
          {/* EMPTY STATE */}

          {roles?.length === 0 && (
            <tr>
              <td colSpan={5}>
                <EmptyState type="empty" />
              </td>
            </tr>
          )}

          {roles?.map((role, idx) => (
            <tr
              key={role.id || idx}
              className="hover:bg-gray-50 transition-colors"
            >
              {/* INDEX */}

              <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                {idx + 1}
              </td>

              {/* ROLE NAME */}

              <td className="px-6 py-4">
                <div className="text-sm font-semibold text-gray-900">
                  {role.name}
                </div>

                <div className="text-xs text-gray-500 mt-1">
                  Type: {role.type || "N/A"}
                </div>
              </td>

              {/* LEVEL */}

              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />

                  <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">
                    Level {role.level}
                  </span>
                </div>
              </td>

              {/* DESCRIPTION */}

              <td className="px-6 py-4">
                <div className="text-sm text-gray-600 max-w-md">
                  {role.description}
                </div>
              </td>

              {/* ACTIONS */}

              <td className="px-6 py-4">
                <div className="flex gap-2">
                  {/* PERMISSION (FOR BOTH TYPES) */}

                  <button
                    onClick={() => onPermission(role)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all shadow-sm"
                  >
                    <Shield size={14} />
                    Permission
                  </button>

                  {/* EDIT + DELETE ONLY FOR EMPLOYEE */}

                  {allowActions && (
                    <>
                      <button
                        onClick={() => onEdit(role)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-all shadow-sm"
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>

                      <button
                        onClick={() => onDelete(role)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-all shadow-sm"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
