import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import ZodErrorCatch from "../../layouts/ZodErrorCatch";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const initialState = {
  services: [],
  providers: [],
  mappings: [],
  currentItem: null,
  isLoading: false,
  error: null,
  success: null,
};

const serviceSlice = createSlice({
  name: "service",
  initialState,
  reducers: {
    serviceRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },

    serviceSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || null;

      if (action.payload?.message) {
        toast.success(action.payload.message);
      }
    },

    serviceFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;

      if (action.payload) toast.error(action.payload);
    },

    setServices: (state, action) => {
      state.services = action.payload;
      state.isLoading = false;
    },

    setProviders: (state, action) => {
      state.providers = action.payload;
      state.isLoading = false;
    },

    setMappings: (state, action) => {
      state.mappings = action.payload;
      state.isLoading = false;
    },

    setCurrentItem: (state, action) => {
      state.currentItem = action.payload;
      state.isLoading = false;
    },

    addItem: (state, action) => {
      const { type, data } = action.payload;

      if (type === "service") state.services.unshift(data);
      if (type === "provider") state.providers.unshift(data);
      if (type === "mapping") state.mappings.unshift(data);
    },

    updateItem: (state, action) => {
      const { type, data } = action.payload;

      const list =
        type === "service"
          ? state.services
          : type === "provider"
            ? state.providers
            : state.mappings;

      const index = list.findIndex((i) => i.id === data.id);

      if (index !== -1) list[index] = data;
    },

    removeItem: (state, action) => {
      const { type, id } = action.payload;

      if (type === "service")
        state.services = state.services.filter((i) => i.id !== id);

      if (type === "provider")
        state.providers = state.providers.filter((i) => i.id !== id);

      if (type === "mapping")
        state.mappings = state.mappings.filter((i) => i.id !== id);
    },
  },
});

export const {
  serviceRequest,
  serviceSuccess,
  serviceFail,
  setServices,
  setProviders,
  setMappings,
  setCurrentItem,
  addItem,
  updateItem,
  removeItem,
} = serviceSlice.actions;

export default serviceSlice.reducer;

export const getAllServices =
  (params = {}) =>
  async (dispatch) => {
    try {
      dispatch(serviceRequest());

      const { type, search, page, limit, isActive } = params;

      const { data } = await axios.post(`/services/lists`, {
        type,
        search,
        page,
        limit,
        isActive,
      });

      const list = data?.data?.data || [];

      if (type === "service") dispatch(setServices(list));
      if (type === "provider") dispatch(setProviders(list));
      if (type === "mapping") dispatch(setMappings(list));

      return data;
    } catch (error) {
      const errMsg = ZodErrorCatch(error);
      dispatch(serviceFail(errMsg));
      throw error;
    }
  };

export const createService = (payload) => async (dispatch) => {
  try {
    dispatch(serviceRequest());

    const { data } = await axios.post(`/services/create`, payload);

    dispatch(addItem({ type: payload.type, data: data.data }));

    dispatch(serviceSuccess(data));

    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);
    dispatch(serviceFail(errMsg));
    throw error;
  }
};

export const updateService = (id, payload) => async (dispatch) => {
  try {
    dispatch(serviceRequest());

    const { data } = await axios.put(`/services/${id}`, payload);

    dispatch(updateItem({ type: payload.type, data: data.data }));

    dispatch(serviceSuccess(data));

    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);
    dispatch(serviceFail(errMsg));
    throw error;
  }
};

export const getServices =
  (params = {}) =>
  async (dispatch) => {
    try {
      dispatch(serviceRequest());

      const { data } = await axios.get("/services", {
        params,
      });
      dispatch(setCurrentItem(data.data));
      return data;
    } catch (error) {
      const errMsg = ZodErrorCatch(error);
      dispatch(serviceFail(errMsg));
      throw error;
    }
  };

// Create / Update / Delete Provider Slab
export const createProviderSlab = (payload) => async (dispatch) => {
  try {
    dispatch(serviceRequest());

    const { data } = await axios.post(`/services/slab`, payload);

    dispatch(serviceSuccess(data));

    if (data.message) {
      toast.success(data.message);
    }

    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);

    dispatch(serviceFail(errMsg));
    toast.error(errMsg);

    throw error;
  }
};
