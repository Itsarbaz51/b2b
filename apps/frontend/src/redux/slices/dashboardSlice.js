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
  ({ range = "7d", status = "ALL" }) =>
  async (dispatch) => {
    try {
      dispatch(request());

      const { data } = await axios.get(
        `/dashboard?range=${range}&status=${status}`,
      );

      dispatch(success(data));
    } catch (err) {
      dispatch(fail());
    }
  };
