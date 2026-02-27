import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

axios.defaults.withCredentials = true;
const baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.baseURL = baseURL;

const initialState = {
  balance: 0,
  transactions: [],
  isLoading: false,
  error: null,
  success: null,
};

const walletSlice = createSlice({
  name: "wallet",
  initialState,
  reducers: {
    walletRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    walletSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || null;
      state.error = null;
      if (action.payload?.message) toast.success(action.payload.message);
    },
    walletFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(state.error);
    },
    setBalance: (state, action) => {
      state.balance = action.payload?.data || action.payload;
    },
    setTransactions: (state, action) => {
      state.isLoading = false;
      state.transactions = action.payload?.data || action.payload;
      state.error = null;
    },
    resetWallet: (state) => {
      state.balance = 0;
      state.transactions = [];
      state.isLoading = false;
      state.error = null;
      state.success = null;
    },
  },
});

export const {
  walletRequest,
  walletSuccess,
  walletFail,
  setBalance,
  setTransactions,
  resetWallet,
} = walletSlice.actions;

// ---------------- API Actions ------------------

// Get wallet balance
export const getWalletBalance = () => async (dispatch) => {
  try {
    dispatch(walletRequest());
    const { data } = await axios.get(`/wallet/balance`);
    dispatch(setBalance(data));
    // dispatch(walletSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(walletFail(errMsg));
  }
};

export const addFunds = (payload) => async (dispatch) => {
  try {
    dispatch(walletRequest());

    const config =
      payload instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : {};

    const { data } = await axios.post(`/wallet/request-fund`, payload, config);
    dispatch(walletSuccess(data));
    dispatch(getWalletBalance());
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(walletFail(errMsg));
    throw error;
  }
};

// Deduct funds
export const deductFunds = (payload) => async (dispatch) => {
  try {
    dispatch(walletRequest());
    const { data } = await axios.post(`/wallet/deduct-funds`, payload);
    dispatch(walletSuccess(data));
    dispatch(getWalletBalance());
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(walletFail(errMsg));
  }
};

// Get transactions
export const getWalletTransactions = (trnType) => async (dispatch) => {

  try {
    dispatch(walletRequest());
    const { data } = await axios.post(`/wallet/get-all-transactions`, trnType);
    dispatch(setTransactions(data));
    // dispatch(walletSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(walletFail(errMsg));
  }
};

//  Create Razorpay order
export const createOrder = (payload) => async (dispatch) => {
  try {
    dispatch(walletRequest());
    const { data } = await axios.post(`/wallet/create-order`, payload);
    dispatch(walletSuccess(data));
    return data; // Razorpay frontend flow will handle this
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(walletFail(errMsg));
  }
};

//  Verify Razorpay payment
export const verifyPayment = (payload) => async (dispatch) => {
  try {
    dispatch(walletRequest());
    const { data } = await axios.post(`/wallet/verify-payment`, payload);
    dispatch(walletSuccess(data));
    dispatch(getWalletBalance());
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(walletFail(errMsg));
  }
};

//  update topup (Admin only)
export const updateTopup = (topupData) => async (dispatch) => {

  try {
    dispatch(walletRequest());
    const { data } = await axios.put(
      `/wallet/update-wallet-topup/${topupData.id}`,
      { status: topupData.status }
    );
    dispatch(walletSuccess(data));
    dispatch(getWalletTransactions());
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(walletFail(errMsg));
  }
};

export default walletSlice.reducer;
