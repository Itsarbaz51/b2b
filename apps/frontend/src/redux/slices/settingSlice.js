// systemSettingSlice.js

import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const initialState = {
  data: null,
  isLoading: false,
  error: null,
  success: null,
};

const systemSettingSlice = createSlice({
  name: "setting",
  initialState,
  reducers: {
    settingRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    settingSuccess: (state, action) => {
      state.isLoading = false;
      state.data = action.payload?.data || null;
      state.success =
        action.payload?.message !== "System setting fetched successfully";
      state.error = null;
    },
    settingFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(action.payload);
    },
    resetSetting: (state) => {
      state.isLoading = false;
      state.data = null;
      state.error = null;
      state.success = null;
    },
  },
});

export const { settingRequest, settingSuccess, settingFail, resetSetting } =
  systemSettingSlice.actions;

export const upsertSystemSetting = (formData) => async (dispatch) => {
  try {
    dispatch(settingRequest());

    const { data } = await axios.post(`/system-setting/upsert`, formData);
    dispatch(settingSuccess(data));
    toast.success(data?.message || "Settings updated successfully!");
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(settingFail(errMsg));
  }
};

export const fetchSystemSetting = () => async (dispatch) => {
  try {
    dispatch(settingRequest());
    const { data } = await axios.get(`/system-setting/show`);
    dispatch(settingSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(settingFail(errMsg));
  }
};

export default systemSettingSlice.reducer;
