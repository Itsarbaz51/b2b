import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  data: null,
  isLoading: false,
};

const slice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    request: (state) => {
      state.isLoading = true;
    },
    success: (state, action) => {
      state.isLoading = false;
      state.data = action.payload;
    },
    fail: (state) => {
      state.isLoading = false;
    },
  },
});

export const { request, success, fail } = slice.actions;
export default slice.reducer;

// 🔥 API
export const getDashboard =
  ({ type, from, to, status = "ALL" }) =>
  async (dispatch) => {
    try {
      dispatch(request());

      let url = `/dashboard?status=${status}`;

      if (type) url += `&type=${type}`;
      if (from && to) url += `&from=${from}&to=${to}`;

      const { data } = await axios.get(url);

      dispatch(success(data));
    } catch (err) {
      dispatch(fail());
    }
  };
