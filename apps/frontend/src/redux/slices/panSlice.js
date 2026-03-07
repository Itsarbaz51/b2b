import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const initialState = {
  isLoading: false,
  error: null,
  success: null,

  panData: null,
  isVerified: false,
};

const panSlice = createSlice({
  name: "pan",
  initialState,
  reducers: {
    panRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },

    panVerifySuccess: (state, action) => {
      state.isLoading = false;
      state.panData = action.payload?.data || null;
      state.isVerified = true;
      state.success = action.payload?.message || "PAN verified";
    },

    panFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(action.payload);
    },

    resetPan: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = null;
      state.panData = null;
      state.isVerified = false;
    },
  },
});

export const { panRequest, panVerifySuccess, panFail, resetPan } =
  panSlice.actions;

export default panSlice.reducer;

// VERIFY PAN
export const verifyPan = (payload) => async (dispatch) => {
  try {
    dispatch(panRequest());

    const { data } = await axios.post("/pan/verify", payload);

    dispatch(panVerifySuccess(data));
    toast.success(data.message);

    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "PAN verification failed";

    dispatch(panFail(errMsg));
    throw error;
  }
};
