import { useEffect, useState, useCallback, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllServices } from "../../redux/slices/serviceSlice";
import AddProviderSlabForm from "../forms/AddProviderSlabForm";
import ProviderSlabTable from "../tabels/ProviderSlabTable";

import { Search, RefreshCw, Plus, Edit } from "lucide-react";

import EmptyState from "../ui/EmptyState";
import AddMappingForm from "../forms/AddMappingForm";
import { paisaToRupee } from "../../utils/lib";
import ActionMenu from "../ui/ActionMenu";

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
              <th className="px-6 py-3 text-left">GST/TDS</th>
              {/* <th className="px-6 py-3 text-left">Selling Price</th> */}
              {/* <th className="px-6 py-3 text-left">Margin</th> */}
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
                      <td className="px-6 py-5">
                        {item.supportsSlab && item.providerSlabs?.length > 0 ? (
                          <div className="space-y-1 text-xs">
                            {item.providerSlabs.map((slab) => (
                              <div
                                key={slab.id}
                                className="bg-gray-100 px-2 py-1 rounded flex justify-between items-center"
                              >
                                <span>
                                  ₹{paisaToRupee(slab.minAmount)} - ₹
                                  {paisaToRupee(slab.maxAmount)}
                                </span>

                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-blue-600">
                                    {item.pricingValueType === "FLAT"
                                      ? `₹${paisaToRupee(slab.providerCost)}`
                                      : `%${paisaToRupee(slab.providerCost)}`}
                                  </span>

                                  <button
                                    onClick={() => {
                                      setSelectedMapping(item);
                                      setEditData(slab);
                                      setShowSlabModal(true);
                                    }}
                                    className="text-blue-500 hover:text-blue-700"
                                  >
                                    <Edit size={14} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-sm font-semibold text-red-500">
                            {item.pricingValueType === "FLAT"
                              ? `₹${paisaToRupee(item.providerCost)}`
                              : `%${paisaToRupee(item.providerCost)}`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {item.mode === "COMMISSION" && item.applyTDS && (
                            <div>TDS: {item.tdsPercent}%</div>
                          )}

                          {item.mode === "SURCHARGE" && item.applyGST && (
                            <div>GST: {item.gstPercent}%</div>
                          )}

                          {!item.applyTDS && !item.applyGST && (
                            <div className="text-gray-400">-</div>
                          )}
                        </div>
                      </td>

                      {/* <td className="px-6 py-4 text-green-600">
                        ₹{paisaToRupee(item.sellingPrice)}
                      </td>

                      <td className="px-6 py-4">₹{margin.toFixed(2)}</td> */}

                      <td className="px-6 py-4">
                        {item.supportsSlab ? "Yes" : "No"}
                      </td>

                      <td className="px-6 py-4">
                        {item.isActive ? "Active" : "Inactive"}
                      </td>

                      <td className="px-6 py-4">
                        <ActionMenu
                          items={[
                            {
                              icon: Edit,
                              label: "Edit",
                              onClick: () => {
                                setEditData(item);
                                setShowModal(true);
                              },
                            },

                            ...(item.supportsSlab
                              ? [
                                  {
                                    icon: Plus,
                                    label: "Add Slab",
                                    onClick: () => {
                                      setSelectedMapping(item);
                                      setEditData(null);
                                      setShowSlabModal(true);
                                    },
                                  },
                                ]
                              : []),
                          ]}
                        />
                      </td>
                    </tr>
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
