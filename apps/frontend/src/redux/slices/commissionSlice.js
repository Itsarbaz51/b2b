import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const initialState = {
  commissionSettings: [],
  commissionEarnings: [],
  commissionSummary: {
    totalCommission: 0,
    todayCommission: 0,
    monthlyCommission: 0,
    totalTransactions: 0,
  },
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

const commissionSlice = createSlice({
  name: "commission",
  initialState,
  reducers: {
    commissionRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    commissionSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || null;
      state.error = null;
    },
    commissionFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    setCommissionSettings: (state, action) => {
      state.commissionSettings = action.payload?.data || action.payload;
    },
    setCommissionEarnings: (state, action) => {
      state.commissionEarnings = action.payload?.data || action.payload;
    },
    setCommissionData: (state, action) => {
      const { commissionSettings, total, page, limit, totalPages } =
        action.payload;
      if (commissionSettings) state.commissionSettings = commissionSettings;
      if (total !== undefined) state.pagination.total = total;
      if (page !== undefined) state.pagination.page = page;
      if (limit !== undefined) state.pagination.limit = limit;
      if (totalPages !== undefined) state.pagination.totalPages = totalPages;
    },
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    clearCommissionError: (state) => {
      state.error = null;
    },
    clearCommissionSuccess: (state) => {
      state.success = null;
    },
    setCommissionEarningsData: (state, action) => {
      const { commissionEarnings, total, page, limit, totalPages } =
        action.payload;

      if (commissionEarnings) state.commissionEarnings = commissionEarnings;

      if (total !== undefined) state.pagination.total = total;
      if (page !== undefined) state.pagination.page = page;
      if (limit !== undefined) state.pagination.limit = limit;
      if (totalPages !== undefined) state.pagination.totalPages = totalPages;
    },
    setCommissionSummary: (state, action) => {
      state.commissionSummary = action.payload || {};
    },
    resetCommission: (state) => {
      state.commissionSettings = [];
      state.commissionEarnings = [];
      state.isLoading = false;
      state.error = null;
      state.success = null;
    },
  },
});

export const {
  commissionRequest,
  commissionSuccess,
  commissionFail,
  setCommissionSettings,
  setCommissionEarnings,
  setCommissionData,
  setCommissionEarningsData,
  setCommissionSummary,
  updatePagination,
  clearCommissionError,
  clearCommissionSuccess,
  resetCommission,
} = commissionSlice.actions;

// Get commission settings by created by with pagination
export const getCommissionSettingsByCreatedBy =
  (filters = {}) =>
  async (dispatch) => {
    try {
      dispatch(commissionRequest());
      const { data } = await axios.get(`/commissions/setting/created-by-me`, {
        params: filters,
      });

      dispatch(
        setCommissionData({
          commissionSettings: data.data?.commissions || data.data || data,
          total: data.data?.total || data.total || 0,
          page: data.data?.page || data.page || 1,
          limit: data.data?.limit || data.limit || 10,
          totalPages: data.data?.totalPages || data.totalPages || 0,
        }),
      );

      dispatch(commissionSuccess(data));
      return data;
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message;
      dispatch(commissionFail(errMsg));
      throw error;
    }
  };

// Create or update commission setting
export const createOrUpdateCommissionSetting =
  (payload) => async (dispatch) => {
    try {
      dispatch(commissionRequest());
      const { data } = await axios.post(`/commissions/setting`, payload);

      dispatch(commissionSuccess(data));

      if (data.message) {
        toast.success(data.message);
      }

      return data;
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message;
      dispatch(commissionFail(errMsg));
      toast.error(errMsg);
      throw error;
    }
  };

// Get commission earnings (Admin / Employee / My Earnings)
export const getCommissionEarnings =
  (filters = {}) =>
  async (dispatch) => {
    try {
      dispatch(commissionRequest());

      const { data } = await axios.get(`/commissions/earnings`, {
        params: filters,
      });

      dispatch(
        setCommissionEarningsData({
          commissionEarnings: data.data.earnings,
          page: data.data.pagination.page,
          limit: data.data.pagination.limit,
          total: data.data.pagination.total,
          totalPages: data.data.pagination.totalPages,
        }),
      );

      dispatch(commissionSuccess(data.message));
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message;
      dispatch(commissionFail(errMsg));
    }
  };

export const getCommissionSummary = () => async (dispatch) => {
  try {
    dispatch(commissionRequest());

    const { data } = await axios.get(`/commissions/earnings/summary`);

    dispatch(setCommissionSummary(data.data));

    dispatch(commissionSuccess(data.message));

    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;

    dispatch(commissionFail(errMsg));
    throw error;
  }
};
// Create or Update Commission Slab
export const createCommissionSlab = (payload) => async (dispatch) => {
  try {
    dispatch(commissionRequest());

    const { data } = await axios.post(`/commissions/slab`, payload);

    dispatch(commissionSuccess(data));

    if (data.message) {
      toast.success(data.message);
    }

    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;

    dispatch(commissionFail(errMsg));
    toast.error(errMsg);

    throw error;
  }
};
export default commissionSlice.reducer;
