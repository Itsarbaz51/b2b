import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const initialState = {
  fundRequests: [],
  isLoading: false,
  error: null,
  success: null,

  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },

  filters: {
    search: "",
  },
};

const fundSlice = createSlice({
  name: "fund",
  initialState,

  reducers: {
    fundRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },

    fundSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || null;
      state.error = null;
    },

    fundFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    setFundRequests: (state, action) => {
      const { fundRequests, total, page, limit, totalPages } = action.payload;

      if (fundRequests) state.fundRequests = fundRequests;
      if (total !== undefined) state.pagination.total = total;
      if (page !== undefined) state.pagination.page = page;
      if (limit !== undefined) state.pagination.limit = limit;
      if (totalPages !== undefined) state.pagination.totalPages = totalPages;
    },

    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    clearFundError: (state) => {
      state.error = null;
    },

    clearFundSuccess: (state) => {
      state.success = null;
    },

    resetFund: (state) => {
      state.fundRequests = [];
      state.isLoading = false;
      state.error = null;
      state.success = null;
    },
  },
});

export const {
  fundRequest,
  fundSuccess,
  fundFail,
  setFundRequests,
  updatePagination,
  clearFundError,
  clearFundSuccess,
  resetFund,
} = fundSlice.actions;

/*
--------------------------------
CREATE FUND REQUEST
--------------------------------
*/

export const createFundRequest = (payload) => async (dispatch) => {
  try {
    dispatch(fundRequest());

    const formData = new FormData();

    Object.keys(payload).forEach((key) => {
      formData.append(key, payload[key]);
    });

    const { data } = await axios.post(`/fund-req/create`, formData);

    dispatch(fundSuccess(data));

    if (data.message) {
      toast.success(data.message);
    }

    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;

    dispatch(fundFail(errMsg));
    toast.error(errMsg);

    throw error;
  }
};

/*
--------------------------------
VERIFY FUND REQUEST
--------------------------------
*/

export const verifyFundRequest = (payload) => async (dispatch) => {
  try {
    dispatch(fundRequest());

    const { data } = await axios.patch(`/fund-req/verify`, payload);

    dispatch(fundSuccess(data));
    toast.success(data.message);

    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;

    dispatch(fundFail(errMsg));
    toast.error(errMsg);

    throw error;
  }
};

export default fundSlice.reducer;
