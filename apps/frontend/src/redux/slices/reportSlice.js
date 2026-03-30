import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const initialState = {
  reports: null, // 🔥 array + object dono handle
  types: [], // 🔥 tabs backend se
  activeType: "profit",

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
    type: "PROFIT",
    search: "",
    from: "",
    to: "",
  },
};

const reportSlice = createSlice({
  name: "report",
  initialState,

  reducers: {
    reportRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },

    reportSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || null;
      state.error = null;
    },

    reportFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    setReports: (state, action) => {
      const { data, pagination, types, activeType } = action.payload;

      state.reports = data || null;

      if (types) state.types = types;

      if (activeType) state.activeType = activeType;

      if (pagination) {
        state.pagination = {
          page: pagination.page || 1,
          limit: pagination.limit || 10,
          total: pagination.total || 0,
          totalPages: pagination.totalPages || 0,
        };
      }
    },

    updateReportFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearReportError: (state) => {
      state.error = null;
    },

    clearReportSuccess: (state) => {
      state.success = null;
    },

    resetReports: (state) => {
      state.reports = [];
      state.isLoading = false;
      state.error = null;
      state.success = null;
    },
  },
});

export const {
  reportRequest,
  reportSuccess,
  reportFail,
  setReports,
  updateReportFilters,
  clearReportError,
  clearReportSuccess,
  resetReports,
} = reportSlice.actions;

export const getReports =
  (filters = {}) =>
  async (dispatch) => {
    try {
      dispatch(reportRequest());

      const { data } = await axios.get(`/report`, {
        params: filters,
      });

      dispatch(
        setReports({
          data: data.data,
          pagination: data.pagination,
          types: data.types, // 🔥 important
          activeType: data.activeType, // 🔥 important
        }),
      );

      dispatch(reportSuccess(data));

      return data;
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message;

      dispatch(reportFail(errMsg));
      toast.error(errMsg);

      throw error;
    }
  };

export default reportSlice.reducer;
