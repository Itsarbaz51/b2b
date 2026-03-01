import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const initialState = {
  services: [],
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
      if (action.payload?.message) toast.success(action.payload.message);
    },
    serviceFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(action.payload);
    },
    setServices: (state, action) => {
      state.isLoading = false;
      state.services = action.payload?.data || action.payload;
    },
    addService: (state, action) => {
      state.services.unshift(action.payload?.data || action.payload);
    },
    updateServiceInList: (state, action) => {
      const updated = action.payload?.data || action.payload;
      const index = state.services.data.findIndex((item) => item.id === updated.id);
      if (index !== -1) {
        state.services[index] = updated;
      }
    },
    removeService: (state, action) => {
      state.services = state.services.filter(
        (item) => item.id !== action.payload,
      );
    },
    resetService: (state) => {
      state.services = [];
      state.currentItem = null;
      state.isLoading = false;
      state.error = null;
      state.success = null;
    },
  },
});

export const {
  serviceRequest,
  serviceSuccess,
  serviceFail,
  setServices,
  addService,
  updateServiceInList,
  removeService,
  resetService,
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

      dispatch(setServices(data));
      return data;
    } catch (error) {
      const errMsg = error?.response?.data?.message || error.message;
      dispatch(serviceFail(errMsg));
      throw error;
    }
  };

export const createService = (payload) => async (dispatch) => {
  try {
    dispatch(serviceRequest());

    const { data } = await axios.post(`/services/create`, payload);

    dispatch(addService(data));
    dispatch(serviceSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error.message;
    dispatch(serviceFail(errMsg));
    throw error;
  }
};

export const updateService = (id, payload) => async (dispatch) => {
  try {
    dispatch(serviceRequest());

    const { data } = await axios.put(`/services/${id}`, payload);

    dispatch(updateServiceInList(data));
    dispatch(serviceSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error.message;
    dispatch(serviceFail(errMsg));
    throw error;
  }
};

export const deleteService = (id, type) => async (dispatch) => {
  try {
    dispatch(serviceRequest());

    await axios.delete(`/services/${id}`, {
      data: { type },
    });

    dispatch(removeService(id));
    toast.success("Deleted successfully");
  } catch (error) {
    const errMsg = error?.response?.data?.message || error.message;
    dispatch(serviceFail(errMsg));
    throw error;
  }
};
