import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const initialState = {
  kycList: [],
  kycDetail: null,
  isLoading: false,
  error: null,
  success: null,
  isKycVerified: false,
};

const kycSlice = createSlice({
  name: "kyc",
  initialState,
  reducers: {
    kycRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    kycListSuccess: (state, action) => {
      state.isLoading = false;
      state.kycList = action.payload?.data || [];
      state.success = action.payload?.message || null;
      state.error = null;
    },
    kycDetailSuccess: (state, action) => {
      state.isLoading = false;
      state.kycDetail = action.payload?.data || null;
      state.success = action.payload?.message || null;
      state.error = null;
    },
    kycActionSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || "KYC action completed";
      state.error = null;
      if (action.payload?.data?.status)
        state.isKycVerified = action.payload.data.status === "VERIFIED";
    },
    kycFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(action.payload);
    },
    resetKyc: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = null;
      state.kycDetail = null;
      state.isKycVerified = false;
    },
  },
});

export const {
  kycRequest,
  kycListSuccess,
  kycDetailSuccess,
  kycActionSuccess,
  kycFail,
  resetKyc,
} = kycSlice.actions;

export default kycSlice.reducer;

// ------------------ submit by users --------------------------
export const kycSubmit = (kycPayload) => async (dispatch) => {
  try {
    dispatch(kycRequest());
    const { data } = await axios.post("kycs/user-kyc-store", kycPayload, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    dispatch(kycActionSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(kycFail(errMsg));
  }
};

export const updatekycSubmit =
  ({ id, data }) =>
  async (dispatch) => {
    try {
      dispatch(kycRequest());
      const response = await axios.put(`kycs/user-kyc-update/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      dispatch(kycActionSuccess(response.data));
      toast.success(response.data.message);
      return response.data;
    } catch (error) {
      console.error("KYC Update Error:", error);
      const errMsg =
        error?.response?.data?.message || error?.message || "KYC update failed";
      dispatch(kycFail(errMsg));
      toast.error(errMsg);
      throw error;
    }
  };

// ------------------ Manage by both (admin & user) --------------------------
export const getbyId = (id) => async (dispatch) => {
  try {
    dispatch(kycRequest());
    const { data } = await axios.get(`kycs/user-kyc-show/${id}`);
    dispatch(kycDetailSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(kycFail(errMsg));
  }
};

// ------------------ Manage by admin --------------------------
export const getKycAll =
  (params = {}) =>
  async (dispatch) => {
    try {
      dispatch(kycRequest());
      const body = {
        status: params.status || "ALL",
        page: params.page || 1,
        limit: params.limit || 10,
        sort: params.sort || "desc",
        search: params.search || "",
      };
      const { data } = await axios.post("kycs/list-kyc", body);
      dispatch(kycListSuccess(data));
      return data;
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message;
      dispatch(kycFail(errMsg));
    }
  };

export const verifyKyc = (payload) => async (dispatch) => {
  try {
    dispatch(kycRequest());
    const { data } = await axios.put("kycs/user-verify", payload);

    dispatch(kycActionSuccess(data));

    toast.success(data.message);
    dispatch(getKycAll());
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.errors?.[0]?.message ||
      error?.response?.data?.message ||
      error?.message ||
      "KYC verification failed";
    dispatch(kycFail(errMsg));
    toast.error(errMsg);
  }
};
