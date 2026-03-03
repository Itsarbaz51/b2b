import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const initialState = {
  isLoading: false,
  error: null,
  success: null,

  otpSent: false,
  referenceId: null,
  transactionId: null,
  aadhaarData: null,
  isVerified: false,
};

const aadhaarSlice = createSlice({
  name: "aadhaar",
  initialState,
  reducers: {
    aadhaarRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },

    sendOtpSuccess: (state, action) => {
      state.isLoading = false;
      state.otpSent = true;
      state.referenceId = action.payload?.referenceId || null;
      state.transactionId = action.payload?.transactionId || null;
      state.success = action.payload?.message || "OTP sent successfully";
    },

    verifyOtpSuccess: (state, action) => {
      state.isLoading = false;
      state.otpSent = false;
      state.aadhaarData = action.payload?.data || null;
      state.isVerified = true;
      state.success = action.payload?.message || "Aadhaar verified";
    },

    aadhaarFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(action.payload);
    },

    resetAadhaar: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = null;
      state.otpSent = false;
      state.referenceId = null;
      state.transactionId = null;
      state.aadhaarData = null;
      state.isVerified = false;
    },
  },
});

export const {
  aadhaarRequest,
  sendOtpSuccess,
  verifyOtpSuccess,
  aadhaarFail,
  resetAadhaar,
} = aadhaarSlice.actions;

export default aadhaarSlice.reducer;

// SEND AADHAAR OTP
export const sendAadhaarOtp = (payload) => async (dispatch) => {
  try {
    dispatch(aadhaarRequest());

    const { data } = await axios.post("/aadhaar/send-otp", payload);

    dispatch(sendOtpSuccess(data));
    toast.success(data.message);

    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message || error?.message || "OTP send failed";

    dispatch(aadhaarFail(errMsg));
    throw error;
  }
};

// VERIFY AADHAAR OTP
export const verifyAadhaarOtp =
  ({ transactionId, referenceId, otp }) =>
  async (dispatch) => {
    try {
      dispatch(aadhaarRequest());

      const { data } = await axios.post("/aadhaar/verify-otp", {
        transactionId,
        referenceId,
        otp,
      });

      dispatch(verifyOtpSuccess(data));
      toast.success(data.message);

      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "OTP verification failed";

      dispatch(aadhaarFail(errMsg));
      throw error;
    }
  };
