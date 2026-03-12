import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const initialState = {
  transactions: [],
  isLoading: false,
  error: null,
  success: null,

  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },

  filters: {
    search: "",
    status: "",
    type: "",
    date: "",
  },
};

const transactionSlice = createSlice({
  name: "transaction",
  initialState,

  reducers: {
    transactionRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },

    transactionSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || null;
      state.error = null;
    },

    transactionFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    setTransactions: (state, action) => {
      const { data, pagination } = action.payload;

      state.transactions = data || [];

      if (pagination) {
        state.pagination.page = pagination.page;
        state.pagination.limit = pagination.limit;
        state.pagination.total = pagination.total;
        state.pagination.pages = pagination.pages;
      }
    },

    updateTransactionFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    clearTransactionError: (state) => {
      state.error = null;
    },

    clearTransactionSuccess: (state) => {
      state.success = null;
    },

    resetTransactions: (state) => {
      state.transactions = [];
      state.isLoading = false;
      state.error = null;
      state.success = null;
    },
  },
});

export const {
  transactionRequest,
  transactionSuccess,
  transactionFail,
  setTransactions,
  updateTransactionFilters,
  clearTransactionError,
  clearTransactionSuccess,
  resetTransactions,
} = transactionSlice.actions;

export const getTransactions =
  (filters = {}) =>
  async (dispatch) => {
    try {
      dispatch(transactionRequest());

      const { data } = await axios.get(`/txn`, {
        params: filters,
      });

      dispatch(
        setTransactions({
          data: data.data || [],
          pagination: data.pagination || {},
        }),
      );

      dispatch(transactionSuccess(data));

      return data;
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message;

      dispatch(transactionFail(errMsg));
      toast.error(errMsg);

      throw error;
    }
  };

export default transactionSlice.reducer;
