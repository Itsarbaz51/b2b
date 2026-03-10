import { useEffect, useState, useCallback, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllServices } from "../../redux/slices/serviceSlice";
import AddProviderSlabForm from "../forms/AddProviderSlabForm";
import ProviderSlabTable from "../tabels/ProviderSlabTable";

import { Search, RefreshCw, Plus } from "lucide-react";

import EmptyState from "../ui/EmptyState";
import AddMappingForm from "../forms/AddMappingForm";
import { paisaToRupee } from "../../utils/lib";

export default function MappingTable() {
  const dispatch = useDispatch();

  const { mappings, isLoading } = useSelector((state) => state.service);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editData, setEditData] = useState(null);

  const [serviceList, setServiceList] = useState([]);
  const [providerList, setProviderList] = useState([]);
  const [showSlabModal, setShowSlabModal] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [openSlabId, setOpenSlabId] = useState(null);

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
  }, [loadMappings]);

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
              <th className="px-6 py-3 text-left">Mode</th>
              <th className="px-6 py-3 text-left">Pricing Type</th>
              <th className="px-6 py-3 text-left">Commission Level</th>
              <th className="px-6 py-3 text-left">Provider Cost</th>
              <th className="px-6 py-3 text-left">Selling Price</th>
              <th className="px-6 py-3 text-left">Margin</th>
              <th className="px-6 py-3 text-left">Slab</th>
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
                const sellingPrice = Number(item.sellingPrice || 0);
                const providerCost = Number(item.providerCost || 0);
                const margin = (sellingPrice - providerCost) / 100;

                return (
                  <Fragment key={item.id}>
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{index + 1}</td>

                      <td className="px-6 py-4 font-semibold">
                        {item.service?.name}
                      </td>

                      <td className="px-6 py-4">{item.provider?.name}</td>

                      <td className="px-6 py-4">{item.mode}</td>

                      <td className="px-6 py-4">{item.pricingValueType}</td>

                      <td className="px-6 py-4">{item.commissionStartLevel}</td>

                      <td className="px-6 py-4 text-red-500">
                        ₹{paisaToRupee(item.providerCost)}
                      </td>

                      <td className="px-6 py-4 text-green-600">
                        ₹{paisaToRupee(item.sellingPrice)}
                      </td>

                      <td className="px-6 py-4">₹{margin.toFixed(2)}</td>

                      <td className="px-6 py-4">
                        {item.supportsSlab ? "Yes" : "No"}
                      </td>

                      <td className="px-6 py-4">
                        {item.isActive ? "Active" : "Inactive"}
                      </td>

                      <td className="px-6 py-4 flex gap-3">
                        <button
                          onClick={() =>
                            setOpenSlabId(
                              openSlabId === item.id ? null : item.id,
                            )
                          }
                          className="text-indigo-600"
                        >
                          {openSlabId === item.id ? "Hide Slabs" : "View Slabs"}
                        </button>

                        <button
                          onClick={() => {
                            setEditData(item);
                            setShowModal(true);
                          }}
                          className="text-blue-600"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>

                    {openSlabId === item.id && (
                      <tr>
                        <td
                          colSpan="12"
                          className="bg-gray-50 px-12 py-6 border-t border-gray-200"
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-700">
                              Provider Slabs
                            </h3>

                            <button
                              onClick={() => {
                                setSelectedMapping(item);
                                setShowSlabModal(true);
                              }}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                            >
                              Add Slab
                            </button>
                          </div>

                          {item.providerSlabs?.length > 0 ? (
                            <ProviderSlabTable
                              slabs={item.providerSlabs}
                              onEdit={(slab) => {
                                setSelectedMapping(item);
                                setEditData(slab);
                                setShowSlabModal(true);
                              }}
                            />
                          ) : (
                            <div className="text-gray-500 text-sm">
                              No slabs configured
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
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

      {showSlabModal && selectedMapping && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-125">
            <h2 className="text-xl font-semibold mb-4">Add Slab</h2>

            <AddProviderSlabForm
              mappingId={selectedMapping.id}
              editData={editData}
              onClose={() => {
                setShowSlabModal(false);
                setEditData(null);
              }}
              onSuccess={loadMappings}
            />
          </div>
        </div>
      )}
    </div>
  );
}
