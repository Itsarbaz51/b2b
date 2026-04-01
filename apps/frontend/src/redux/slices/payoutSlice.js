import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import ZodErrorCatch from "../../layouts/ZodErrorCatch";

const initialState = {
  payouts: [],
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

const payoutSlice = createSlice({
  name: "payout",
  initialState,

  reducers: {
    payoutRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },

    payoutSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || null;
      state.error = null;
    },

    payoutFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    setPayouts: (state, action) => {
      const { payouts, total, page, limit, totalPages } = action.payload;

      if (payouts) state.payouts = payouts;
      if (total !== undefined) state.pagination.total = total;
      if (page !== undefined) state.pagination.page = page;
      if (limit !== undefined) state.pagination.limit = limit;
      if (totalPages !== undefined) state.pagination.totalPages = totalPages;
    },

    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },

    clearPayoutError: (state) => {
      state.error = null;
    },

    clearPayoutSuccess: (state) => {
      state.success = null;
    },

    resetPayout: (state) => {
      state.payouts = [];
      state.isLoading = false;
      state.error = null;
      state.success = null;
    },
  },
});

export const {
  payoutRequest,
  payoutSuccess,
  payoutFail,
  setPayouts,
  updatePagination,
  clearPayoutError,
  clearPayoutSuccess,
  resetPayout,
} = payoutSlice.actions;

export default payoutSlice.reducer;

/*
--------------------------------
CREATE PAYOUT
--------------------------------
*/

export const createPayout = (payload) => async (dispatch) => {
  try {
    dispatch(payoutRequest());

    const { data } = await axios.post(`/payout/create`, payload);

    dispatch(payoutSuccess(data));

    if (data.message) {
      toast.success(data.message);
    }

    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);

    dispatch(payoutFail(errMsg));
    toast.error(errMsg);

    throw error;
  }
};

/*
--------------------------------
CHECK PROVIDER BALANCE
--------------------------------
*/

export const checkPayoutBalance = (payload) => async (dispatch) => {
  try {
    dispatch(payoutRequest());

    const { data } = await axios.post(`/payout/balance`, payload);

    dispatch(payoutSuccess(data));

    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);

    dispatch(payoutFail(errMsg));
    toast.error(errMsg);

    throw error;
  }
};

/*
--------------------------------
CHECK PAYOUT STATUS
--------------------------------
*/

export const checkPayoutStatus = (payload) => async (dispatch) => {
  try {
    dispatch(payoutRequest());

    const { data } = await axios.post(`/payout/status`, payload);

    dispatch(payoutSuccess(data));

    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);

    dispatch(payoutFail(errMsg));
    toast.error(errMsg);

    throw error;
  }
};
