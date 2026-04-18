import { useEffect, useState, useCallback, Fragment } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAllServices } from "../../redux/slices/serviceSlice";
import AddProviderSlabForm from "../forms/AddProviderSlabForm";
import ProviderSlabTable from "../tabels/ProviderSlabTable";

import { Search, RefreshCw, Plus, Edit, X } from "lucide-react";

import EmptyState from "../ui/EmptyState";
import AddMappingForm from "../forms/AddMappingForm";
import { paisaToRupee } from "../../utils/lib";
import ActionMenu from "../ui/ActionMenu";
import AddPaymentMethodChargeForm from "../forms/AddPaymentMethodChargeForm";

const MAX_VISIBLE = 2;

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

  const [showPaymentChargeModal, setShowPaymentChargeModal] = useState(false);
  const [selectedChargeMapping, setSelectedChargeMapping] = useState(null);
  const [editChargeData, setEditChargeData] = useState(null);
  const [viewModal, setViewModal] = useState({
    open: false,
    type: null, // "SLAB" | "PAYMENT"
    mapping: null,
  });

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
              <th className="px-6 py-3 text-left">Payment Method</th>
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
                        {/* ================= SLAB ================= */}
                        {item.supportsSlab && item.providerSlabs?.length > 0 ? (
                          <div className="space-y-1 text-xs">
                            {item.providerSlabs
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
                            {item.providerSlabs.length > MAX_VISIBLE && (
                              <button
                                onClick={() =>
                                  setViewModal({
                                    open: true,
                                    type: "SLAB",
                                    mapping: item,
                                  })
                                }
                                className="text-blue-600 text-xs font-semibold hover:underline"
                              >
                                View All ({item.providerSlabs.length})
                              </button>
                            )}
                          </div>
                        ) : item.paymentMethodCharges?.length > 0 ? (
                          /* ================= PAYMENT CHARGES ================= */
                          <div className="space-y-1 text-xs">
                            {item.paymentMethodCharges
                              .slice(0, MAX_VISIBLE)
                              .map((charge) => (
                                <div
                                  key={charge.id}
                                  className="bg-purple-50 px-2 py-1 rounded flex justify-between items-center"
                                >
                                  <span>
                                    {item.service?.code === "BBPS"
                                      ? `${charge.category || "All"} - ${charge.operator || "All"}`
                                      : `${charge.paymentMethod}${charge.network ? ` (${charge.network})` : ""}`}
                                  </span>

                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-purple-600">
                                      {charge.pricingValueType === "FLAT"
                                        ? `₹${paisaToRupee(charge.value)}`
                                        : `${paisaToRupee(charge.value)}%`}
                                    </span>

                                    <button
                                      onClick={() => {
                                        setSelectedChargeMapping(item);
                                        setEditChargeData(charge);
                                        setShowPaymentChargeModal(true);
                                      }}
                                      className="text-blue-500 hover:text-blue-700"
                                    >
                                      <Edit size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            {item.paymentMethodCharges.length > MAX_VISIBLE && (
                              <button
                                onClick={() =>
                                  setViewModal({
                                    open: true,
                                    type: "PAYMENT",
                                    mapping: item,
                                  })
                                }
                                className="text-purple-600 text-xs font-semibold hover:underline"
                              >
                                View All ({item.paymentMethodCharges.length})
                              </button>
                            )}
                          </div>
                        ) : (
                          /* ================= DEFAULT ================= */
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
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            item.supportsSlab
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.supportsSlab ? "Yes" : "No"}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${
                            item.supportPaymentMethod
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {item.supportPaymentMethod ? "Yes" : "No"}
                        </span>
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

                            ...(item.supportPaymentMethod
                              ? [
                                  {
                                    icon: Plus,
                                    label: "Add Payment Charge",
                                    onClick: () => {
                                      setSelectedChargeMapping(item);
                                      setEditChargeData(null);
                                      setShowPaymentChargeModal(true);
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

      {showPaymentChargeModal && selectedChargeMapping && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-[450px]">
            <AddPaymentMethodChargeForm
              selectedChargeMapping={selectedChargeMapping}
              mappingId={selectedChargeMapping.id}
              editData={editChargeData}
              onClose={() => {
                setShowPaymentChargeModal(false);
                setEditChargeData(null);
              }}
              onSuccess={loadMappings}
            />
          </div>
        </div>
      )}
      {viewModal.open && viewModal.mapping && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg p-6">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">
                {viewModal.type === "SLAB"
                  ? "All Slabs"
                  : "All Payment Charges"}
              </h2>

              <button
                onClick={() =>
                  setViewModal({ open: false, type: null, mapping: null })
                }
              >
                <X />
              </button>
            </div>

            {/* LIST */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {/* 🔵 SLABS */}
              {viewModal.type === "SLAB" &&
                viewModal.mapping.providerSlabs?.map((slab) => (
                  <div
                    key={slab.id}
                    className="bg-gray-100 p-2 rounded flex justify-between items-center"
                  >
                    <span>
                      ₹{paisaToRupee(slab.minAmount)} - ₹
                      {paisaToRupee(slab.maxAmount)}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {viewModal.mapping.pricingValueType === "FLAT"
                          ? `₹${paisaToRupee(slab.providerCost)}`
                          : `${paisaToRupee(slab.providerCost)}%`}
                      </span>

                      {/* EDIT */}
                      <button
                        onClick={() => {
                          setSelectedMapping(viewModal.mapping);
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

              {/* 🟣 PAYMENT */}
              {viewModal.type === "PAYMENT" &&
                viewModal.mapping.paymentMethodCharges?.map((charge) => (
                  <div
                    key={charge.id}
                    className="bg-purple-50 p-2 rounded flex justify-between items-center"
                  >
                    <span>
                      {viewModal.mapping.service?.code === "BBPS"
                        ? `${charge.category || "All"} - ${charge.operator || "All"}`
                        : `${charge.paymentMethod}${charge.network ? ` (${charge.network})` : ""}`}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {charge.pricingValueType === "FLAT"
                          ? `₹${paisaToRupee(charge.value)}`
                          : `${paisaToRupee(charge.value)}%`}
                      </span>

                      {/* EDIT */}
                      <button
                        onClick={() => {
                          setSelectedChargeMapping(viewModal.mapping);
                          setEditChargeData(charge);
                          setShowPaymentChargeModal(true);
                        }}
                        className="text-purple-500 hover:text-purple-700"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
