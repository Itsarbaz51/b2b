import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
const baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = baseURL;

const initialState = {
  stateList: [],
  cityList: [],
  isLoading: false,
  error: null,
  success: null,
};

const addressSlice = createSlice({
  name: "address",
  initialState,
  reducers: {
    requestStart: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    requestSuccess: (state, action) => {
      state.isLoading = false;
      const { type, data, message } = action.payload;

      if (type === "state-list") {
        state.stateList = data;
      } else if (type === "city-list") {
        state.cityList = data;
      }

      state.success = message || null;
      state.error = null;
    },
    requestFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(action.payload);
    },
    reset: (state) => {
      state.stateList = [];
      state.cityList = [];
      state.isLoading = false;
      state.success = null;
      state.error = null;
    },
  },
});

export const { requestStart, requestSuccess, requestFail, reset } =
  addressSlice.actions;

// Create (POST)
export const createEntity = (entityType, payload) => async (dispatch) => {
  try {
    dispatch(requestStart());
    const { data } = await axios.post(`addresses/${entityType}`, payload);
    toast.success(data.message);
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(requestFail(errMsg));
  }
};

// Read all (GET)
export const getAllEntities = (entityType) => async (dispatch) => {
  try {
    dispatch(requestStart());

    let endpoint = "";
    switch (entityType) {
      case "state-list":
        endpoint = "addresses/state-list";
        break;
      case "city-list":
        endpoint = "addresses/city-list";
        break;
      default:
        endpoint = `addresses/${entityType}`;
    }

    const { data } = await axios.get(endpoint);
    const responseData = Array.isArray(data?.data)
      ? data.data
      : Array.isArray(data)
      ? data
      : [];

    dispatch(
      requestSuccess({
        type: entityType,
        data: responseData,
        message: data?.message,
      })
    );

    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";
    dispatch(requestFail(errMsg));
  }
};

// Update (PUT)
export const updateEntity =
  (entityType, id, updatedData) => async (dispatch) => {
    try {
      dispatch(requestStart());
      const { data } = await axios.put(
        `/addresses/${entityType}/${id}`,
        updatedData
      );
      dispatch(requestSuccess(data));
      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong";
      dispatch(requestFail(errMsg));
    }
  };
// Delete (DELETE)
export const deleteEntity = (entityType, id) => async (dispatch) => {
  try {
    dispatch(requestStart());

    let endpoint = "";
    switch (entityType) {
      case "state-delete":
        endpoint = `addresses/state-delete/${id}`;
        break;
      case "city":
        endpoint = `addresses/city/${id}`;
        break;
      default:
        endpoint = `addresses/${entityType}/${id}`;
    }

    const { data } = await axios.delete(endpoint);
    toast.success(data.message || "Deleted successfully");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Something went wrong";
    dispatch(requestFail(errMsg));
  }
};

export default addressSlice.reducer;
