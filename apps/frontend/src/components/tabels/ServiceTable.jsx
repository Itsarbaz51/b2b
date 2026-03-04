import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllServices } from "../../redux/slices/serviceSlice";

import { Layers, Edit, Plus, Search, RefreshCw } from "lucide-react";

import ButtonField from "../ui/ButtonField";
import EmptyState from "../ui/EmptyState";

import AddServiceForm from "../forms/AddServiceForm";

export default function ServiceTable() {
  const dispatch = useDispatch();

  const { services, isLoading } = useSelector((state) => state.service);

  const data = services || [];

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  // Load services
  const loadServices = useCallback(() => {
    dispatch(getAllServices({ type: "service" }));
  }, [dispatch]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  const handleEdit = (item) => {
    setEditData(item);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditData(null);
    setShowModal(true);
  };

  const handleRefresh = () => {
    loadServices();
  };

  const filteredServices = data.filter(
    (item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.code?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* Search + Add */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-1">
              Services
            </h2>

            <p className="text-gray-600">Manage your system services</p>
          </div>

          <div className="flex gap-4 items-center">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />

              <input
                type="text"
                placeholder="Search services..."
                className="pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Refresh */}
            <button
              onClick={handleRefresh}
              className="px-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>

            {/* Add Service */}
            <ButtonField
              name="Add Service"
              icon={Plus}
              isOpen={handleCreate}
              css
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white w-full rounded-xl shadow-lg border border-gray-300 overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                #
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Service
              </th>

              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase">
                Code
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
            ) : filteredServices.length === 0 ? (
              <tr>
                <td colSpan="6">
                  <EmptyState type="empty" />
                </td>
              </tr>
            ) : (
              filteredServices.map((item, index) => (
                <tr key={item.id} className="hover:bg-blue-50 transition-all">
                  <td className="px-6 py-5">{index + 1}</td>

                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Layers className="w-5 h-5 text-blue-600" />
                      </div>

                      <div>
                        <p className="font-semibold text-gray-900">
                          {item.name}
                        </p>

                        <p className="text-xs text-gray-500">Service</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-5 text-gray-700">{item.code}</td>

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

                  <td className="px-6 py-5 text-center">
                    <div className="flex justify-center gap-4">
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex items-center text-blue-600 hover:text-blue-700"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <AddServiceForm
          editData={editData}
          onClose={() => setShowModal(false)}
          onSuccess={loadServices}
        />
      )}
    </div>
  );
}
