import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import ZodErrorCatch from "../../layouts/ZodErrorCatch";

const initialState = {
  reports: null,
  isLoading: false,
  error: null,
};

const reportSlice = createSlice({
  name: "report",
  initialState,

  reducers: {
    reportRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    reportSuccess: (state, action) => {
      state.isLoading = false;
      state.reports = action.payload;
    },

    reportFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },
  },
});

export const { reportRequest, reportSuccess, reportFail } = reportSlice.actions;

export const getReports =
  (filters = {}) =>
  async (dispatch) => {
    try {
      dispatch(reportRequest());

      const { data } = await axios.get("/report", {
        params: filters,
      });

      dispatch(reportSuccess(data.data));
    } catch (error) {
      const errMsg = ZodErrorCatch(error);

      dispatch(reportFail(errMsg));
      toast.error(errMsg);
    }
  };

export default reportSlice.reducer;
