import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import ZodErrorCatch from "../../layouts/ZodErrorCatch";

const initialState = {
  categories: [],
  billDetails: null,
  fetchedBill: null,
  isLoading: false,
  error: null,
  success: null,
};

const bbpsSlice = createSlice({
  name: "bbps",
  initialState,

  reducers: {
    bbpsRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },

    bbpsSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || null;
      state.error = null;
    },

    bbpsFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    setCategories: (state, action) => {
      state.categories = action.payload;
    },

    setBillDetails: (state, action) => {
      state.billDetails = action.payload;
    },

    setFetchedBill: (state, action) => {
      state.fetchedBill = action.payload;
    },

    clearBbpsError: (state) => {
      state.error = null;
    },

    clearBbpsSuccess: (state) => {
      state.success = null;
    },

    resetBbps: (state) => {
      state.categories = [];
      state.billDetails = null;
        state.fetchedBill = null;
      state.isLoading = false;
      state.error = null;
      state.success = null;
    },
  },
});

export const {
  bbpsRequest,
  bbpsSuccess,
  bbpsFail,
  setCategories,
  setBillDetails,
  setFetchedBill,
  clearBbpsError,
  clearBbpsSuccess,
  resetBbps,
} = bbpsSlice.actions;

export default bbpsSlice.reducer;

export const getBbpsCategories = (payload) => async (dispatch) => {
  try {
    dispatch(bbpsRequest());

    const { data } = await axios.post(`/bbps/categories`, payload);

    dispatch(setCategories(data.data));
    dispatch(bbpsSuccess(data));

    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);

    dispatch(bbpsFail(errMsg));
    toast.error(errMsg);

    throw error;
  }
};

export const selectBiller = (payload) => async (dispatch) => {
  try {
    dispatch(bbpsRequest());

    const { data } = await axios.post(`/bbps/select-biller`, payload);

    dispatch(setBillDetails(data.data));
    dispatch(bbpsSuccess(data));

    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);

    dispatch(bbpsFail(errMsg));
    toast.error(errMsg);

    throw error;
  }
};

export const fetchBill = (payload) => async (dispatch) => {
  try {
    dispatch(bbpsRequest());

    const { data } = await axios.post(`/bbps/fetch-bill`, payload);

    dispatch(setFetchedBill(data.data)); // ✅ ADD THIS
    dispatch(bbpsSuccess(data));

    if (data.message) {
      toast.success(data.message);
    }

    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);

    dispatch(bbpsFail(errMsg));
    toast.error(errMsg);

    throw error;
  }
};

export const payBill = (payload) => async (dispatch) => {
  try {
    dispatch(bbpsRequest());

    const { data } = await axios.post(`/bbps/pay`, payload);

    dispatch(bbpsSuccess(data));

    if (data.message) {
      toast.success(data.message);
    }

    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);

    dispatch(bbpsFail(errMsg));
    toast.error(errMsg);

    throw error;
  }
};
