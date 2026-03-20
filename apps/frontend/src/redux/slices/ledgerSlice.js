import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  data: [],
  pagination: null,
  isLoading: false,
  error: null,
};

const slice = createSlice({
  name: "ledger",
  initialState,
  reducers: {
    request: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    success: (state, action) => {
      state.isLoading = false;
      state.data = action.payload.data;
      state.pagination = action.payload.pagination;
    },
    fail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    clearLedger: (state) => {
      state.data = [];
      state.pagination = null;
    },
  },
});

export const { request, success, fail, clearLedger } = slice.actions;
export default slice.reducer;

export const getLedger =
  ({
    page = 1,
    limit = 20,
    startDate,
    endDate,
    type = "ALL",
    transactionId,
  } = {}) =>
  async (dispatch) => {
    try {
      dispatch(request());

      const params = {
        page,
        limit,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(type && { type }),
        ...(transactionId && { transactionId }),
      };

      const { data } = await axios.get("/ledger", { params });

      dispatch(success(data));
    } catch (err) {
      dispatch(fail(err?.response?.data?.message || "Something went wrong"));
    }
  };
