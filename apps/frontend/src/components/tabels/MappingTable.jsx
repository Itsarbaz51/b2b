import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllServices } from "../../redux/slices/serviceSlice";

import { Search, RefreshCw, Plus, Edit, Trash2 } from "lucide-react";

import EmptyState from "../ui/EmptyState";
import AddMappingForm from "../forms/AddMappingForm";

export default function MappingTable() {
  const dispatch = useDispatch();

  const { mappings, isLoading } = useSelector((state) => state.service);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [serviceList, setServiceList] = useState([]);
  const [providerList, setProviderList] = useState([]);

  const data = mappings || [];

  const loadMappings = useCallback(() => {
    dispatch(getAllServices({ type: "mapping" }));
  }, [dispatch]);

  const loadServices = async () => {
    const res = await dispatch(getAllServices({ type: "service" }));
    setServiceList(res?.data?.data || []);
  };

  const loadProviders = async () => {
    const res = await dispatch(getAllServices({ type: "provider" }));
    setProviderList(res?.data?.data || []);
  };

  useEffect(() => {
    loadMappings();
    loadServices();
    loadProviders();
  }, []);

  const filteredMappings = data.filter(
    (item) =>
      item.service?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.provider?.name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-300 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Service Mapping</h2>

            <p className="text-gray-600">Manage providers and pricing</p>
          </div>

          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />

              <input
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              onClick={loadMappings}
              className="border border-gray-300 px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus size={16} />
              Add Mapping
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-300 rounded-xl overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">#</th>
              <th className="px-6 py-3 text-left">Service</th>
              <th className="px-6 py-3 text-left">Provider</th>
              <th className="px-6 py-3 text-left">Selling Price</th>
              <th className="px-6 py-3 text-left">Provider Cost</th>
              <th className="px-6 py-3 text-left">Margin</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan="7">
                  <EmptyState type="loading" />
                </td>
              </tr>
            ) : (
              filteredMappings.map((item, index) => {
                const margin =
                  Number(item.sellingPrice) - Number(item.providerCost);

                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{index + 1}</td>

                    <td className="px-6 py-4 font-semibold">
                      {item.service?.name}
                    </td>

                    <td className="px-6 py-4">{item.provider?.name}</td>

                    <td className="px-6 py-4 text-green-600">
                      ₹{item.sellingPrice}
                    </td>

                    <td className="px-6 py-4 text-red-500">
                      ₹{item.providerCost}
                    </td>

                    <td className="px-6 py-4 text-blue-600">₹{margin}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          item.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-6 py-4 flex justify-center gap-3">
                      <button
                        onClick={() => {
                          setEditData(item);
                          setShowModal(true);
                        }}
                        className="text-blue-600 flex items-center gap-1"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <AddMappingForm
          editData={editData}
          services={serviceList}
          providers={providerList}
          onClose={() => {
            setShowModal(false);
            setEditData(null);
          }}
          onSuccess={loadMappings}
        />
      )}
    </div>
  );
}
