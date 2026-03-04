import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllServices } from "../../redux/slices/serviceSlice";

import { Server, Search, RefreshCw, Plus, Edit } from "lucide-react";

import EmptyState from "../ui/EmptyState";
import AddProviderForm from "../forms/AddProviderForm";

export default function ProviderTable() {
  const dispatch = useDispatch();

  const { providers, isLoading } = useSelector((state) => state.service);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const data = providers || [];

  const loadProviders = useCallback(() => {
    dispatch(getAllServices({ type: "provider" }));
  }, [dispatch]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const handleEdit = (provider) => {
    setEditData(provider);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditData(null);
    setShowModal(true);
  };

  const filteredProviders = data.filter(
    (item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.code?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* Search + Refresh + Add */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Providers
            </h2>
            <p className="text-gray-600">Manage external API providers</p>
          </div>

          <div className="flex gap-4 items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />

              <input
                type="text"
                placeholder="Search providers..."
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Refresh */}
            <button
              onClick={loadProviders}
              className="px-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            {/* Add Provider */}
            <button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Provider
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-300 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                #
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Provider
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Code
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Services
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Status
              </th>

              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700 uppercase">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan="6">
                  <EmptyState type="loading" />
                </td>
              </tr>
            ) : filteredProviders.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <EmptyState type="empty" />
                </td>
              </tr>
            ) : (
              filteredProviders.map((item, index) => (
                <tr key={item.id} className="hover:bg-blue-50">
                  <td className="px-6 py-5">{index + 1}</td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <Server className="w-5 h-5 text-indigo-600" />
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">Provider</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-gray-700">{item.code}</td>

                  <td className="px-6 py-5">
                    {item.mappings?.length ? (
                      <div className="flex flex-wrap gap-2">
                        {item.mappings.map((map) => (
                          <span
                            key={map.id}
                            className="px-3 py-1 text-xs rounded-full bg-blue-100 text-blue-700 border border-blue-300"
                          >
                            {map.service?.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No Services</span>
                    )}
                  </td>

                  <td className="px-6 py-5">
                    <span
                      className={`px-3 py-1 text-xs rounded-full font-semibold border ${
                        item.isActive
                          ? "bg-green-100 text-green-700 border-green-300"
                          : "bg-red-100 text-red-700 border-red-300"
                      }`}
                    >
                      {item.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Edit Action */}
                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={() => handleEdit(item)}
                      className="flex items-center justify-center gap-1 text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Provider Create/Edit Modal */}
      {showModal && (
        <AddProviderForm
          editData={editData}
          onClose={() => {
            setShowModal(false);
            setEditData(null);
          }}
          onSuccess={loadProviders}
        />
      )}
    </div>
  );
}
