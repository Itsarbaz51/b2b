import { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Search,
  CheckCircle,
  X,
  Map,
  Building2,
} from "lucide-react";
import { AddCityModal, AddStateModal } from "../forms/AddAddress";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllEntities,
  createEntity,
  updateEntity,
  deleteEntity,
} from "../../redux/slices/addressSlice";

export default function Address() {
  const dispatch = useDispatch();

  const {
    stateList = [],
    cityList = [],
    isLoading,
  } = useSelector((state) => state.address);

  // local states
  const [stateModalOpen, setStateModalOpen] = useState(false);
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [editingState, setEditingState] = useState(null);
  const [editStateName, setEditStateName] = useState("");
  const [editingCity, setEditingCity] = useState(null);
  const [editCityName, setEditCityName] = useState("");

  // fetch on mount
  useEffect(() => {
    dispatch(getAllEntities("state-list"));
    dispatch(getAllEntities("city-list"));
  }, [dispatch]);

  // filters
  const filteredStates = stateList.filter((s) =>
    s.stateName?.toLowerCase().includes(stateSearch.toLowerCase())
  );
  const filteredCities = cityList.filter(
    (c) =>
      c.cityName?.toLowerCase().includes(citySearch.toLowerCase()) ||
      c.stateName?.toLowerCase().includes(citySearch.toLowerCase())
  );

  // --- CRUD: STATES ---
  const handleAddState = async (stateName) => {
    if (!stateName) return alert("Please enter a state name");
    const exists = stateList.some(
      (s) => s.stateName.toLowerCase() === stateName.toLowerCase()
    );
    if (exists) return alert("State already exists");

    await dispatch(createEntity("state-store", { stateName }));
    dispatch(getAllEntities("state-list"));
  };

  const handleDeleteState = async (id) => {
    if (confirm("Are you sure you want to delete this state?")) {
      await dispatch(deleteEntity("state-delete", id));
      dispatch(getAllEntities("state-list"));
    }
  };

  const handleEditState = (state) => {
    setEditingState(state.id);
    setEditStateName(state.stateName);
  };

  const handleSaveState = async (id) => {
    if (!editStateName.trim()) return alert("State name cannot be empty");
    await dispatch(
      updateEntity("state-update", id, { stateName: editStateName })
    );
    setEditingState(null);
    dispatch(getAllEntities("state-list"));
  };

  // --- CRUD: CITIES ---
  const handleAddCity = async (cityData) => {
    await dispatch(createEntity("city-store", cityData));
    dispatch(getAllEntities("city-list"));
  };

  const handleDeleteCity = async (id) => {
    if (confirm("Are you sure you want to delete this city?")) {
      await dispatch(deleteEntity("city-delete", id));
      dispatch(getAllEntities("city-list"));
    }
  };

  const handleEditCity = (city) => {
    setEditingCity(city.id);
    setEditCityName(city.cityName);
  };

  const handleSaveCity = async (id) => {
    if (!editCityName.trim()) return alert("City name cannot be empty");
    await dispatch(updateEntity("city-update", id, { cityName: editCityName }));
    setEditingCity(null);
    dispatch(getAllEntities("city-list"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MapPin size={32} />
            State & City Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage states and cities for your system
          </p>
        </div>
        <div className="flex gap-3">
          <div className="px-5 py-2 bg-cyan-50 rounded-full font-semibold">
            {stateList.length} States
          </div>
          <div className="px-5 py-2 bg-purple-50 rounded-full font-semibold">
            {cityList.length} Cities
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="mb-4 p-4 bg-blue-100 rounded-lg">
          <p className="text-blue-700">Loading...</p>
        </div>
      )}

      {/* Add buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setStateModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white font-semibold rounded-lg shadow"
        >
          <Plus size={20} /> Add State
        </button>
        <button
          onClick={() =>
            stateList.length > 0
              ? setCityModalOpen(true)
              : alert("Please add a state first")
          }
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold rounded-lg shadow"
        >
          <Plus size={20} /> Add City
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* STATES */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Map className="text-cyan-500" />
                States
              </h2>
              <span className="text-sm font-semibold text-cyan-700 bg-cyan-100 px-3 py-1 rounded-full">
                {filteredStates.length}
              </span>
            </div>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                value={stateSearch}
                onChange={(e) => setStateSearch(e.target.value)}
                placeholder="Search states..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div className="p-6 max-h-[500px] overflow-y-auto space-y-3">
            {filteredStates.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No states found
              </div>
            ) : (
              filteredStates.map((state) => (
                <div
                  key={state.id}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  {editingState === state.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editStateName}
                        onChange={(e) => setEditStateName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 border-cyan-500 rounded-lg"
                      />
                      <button
                        onClick={() => handleSaveState(state.id)}
                        className="p-2 bg-green-500 text-white rounded-lg"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => setEditingState(null)}
                        className="p-2 bg-gray-500 text-white rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-cyan-500 rounded-lg flex items-center justify-center">
                          <MapPin className="text-white" size={18} />
                        </div>
                        <span className="font-medium text-gray-900">
                          {state.stateName}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditState(state)}
                          className="p-2 bg-amber-50 text-amber-600 rounded-lg"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteState(state.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* CITIES */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-300 bg-gray-50">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Building2 className="text-purple-500" />
                Cities
              </h2>
              <span className="text-sm font-semibold text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                {filteredCities.length}
              </span>
            </div>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search cities or states..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="p-6 max-h-[500px] overflow-y-auto space-y-3">
            {filteredCities.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                No cities found
              </div>
            ) : (
              filteredCities.map((city) => (
                <div
                  key={city.id}
                  className="flex items-center justify-between p-3 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  {editingCity === city.id ? (
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editCityName}
                        onChange={(e) => setEditCityName(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 border-purple-500 rounded-lg"
                      />
                      <button
                        onClick={() => handleSaveCity(city.id)}
                        className="p-2 bg-green-500 text-white rounded-lg"
                      >
                        <CheckCircle size={16} />
                      </button>
                      <button
                        onClick={() => setEditingCity(null)}
                        className="p-2 bg-gray-500 text-white rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-purple-500 rounded-lg flex items-center justify-center">
                          <Building2 className="text-white" size={18} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {city.cityName}
                          </p>
                          {city.stateName && (
                            <p className="text-sm text-gray-600">
                              {city.stateName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditCity(city)}
                          className="p-2 bg-amber-50 text-amber-600 rounded-lg"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteCity(city.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddStateModal
        isOpen={stateModalOpen}
        onClose={() => setStateModalOpen(false)}
        onAdd={handleAddState}
      />
      {cityModalOpen && (
        <AddCityModal
          isOpen={true}
          onClose={() => setCityModalOpen(false)}
          onAdd={handleAddCity}
        />
      )}
    </div>
  );
}
