import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ZodErrorCatch from "../../layouts/ZodErrorCatch";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const initialState = {
  bankList: [],
  myBankList: [],
  bankDetail: null,
  isLoading: false,
  error: null,
  success: null,
  isBankVerified: false,
};

const bankSlice = createSlice({
  name: "bank",
  initialState,
  reducers: {
    bankRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    bankListSuccess: (state, action) => {
      state.isLoading = false;
      state.bankList = action.payload?.data || [];
      state.success = action.payload?.message || null;
      state.error = null;
    },
    myBankListSuccess: (state, action) => {
      state.isLoading = false;
      state.myBankList = action.payload?.data || [];
      state.success = action.payload?.message || null;
      state.error = null;
      if (action.payload?.data?.status)
        state.isBankVerified = action.payload.data.status === "verified";
    },
    bankDetailSuccess: (state, action) => {
      state.isLoading = false;
      state.bankDetail = action.payload?.data || null;
      state.success = action.payload?.message || null;
      state.error = null;
      if (action.payload?.data?.status)
        state.isBankVerified = action.payload.data.status === "verified";
    },
    bankActionSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || "Bank action completed";
      state.error = null;
      if (action.payload?.data?.status)
        state.isBankVerified = action.payload.data.status === "verified";
    },
    bankFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(action.payload);
    },
    resetBank: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = null;
      state.bankDetail = null;
      state.isBankVerified = false;
    },
  },
});

export const {
  bankRequest,
  bankListSuccess,
  myBankListSuccess,
  bankDetailSuccess,
  bankActionSuccess,
  bankFail,
  resetBank,
} = bankSlice.actions;

export default bankSlice.reducer;

// ------------------ API Actions ------------------

// Add bank
export const addBank = (bankPayload) => async (dispatch) => {
  try {
    dispatch(bankRequest());
    const { data } = await axios.post(`/banks/store-bank`, bankPayload);
    dispatch(bankActionSuccess(data));
    return data;
  } catch (error) {
    const finalError = ZodErrorCatch(error);
    dispatch(bankFail(finalError));
  }
};

export const updateBank = (payload) => async (dispatch) => {
  try {
    dispatch(bankRequest());
    const { data } = await axios.put(
      `/banks/bank-update/${payload.id}`,
      payload.data
    );
    dispatch(bankActionSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(bankFail(errMsg));
  }
};

// Get all banks (admin)
export const getAllBanks =
  (payload = {}) =>
  async (dispatch) => {
    try {
      dispatch(bankRequest());
      const { data } = await axios.post(`/banks/bank-list`, payload);
      dispatch(bankListSuccess(data));
      return data;
    } catch (error) {
      const errMsg = error?.response?.data?.message || error?.message;
      dispatch(bankFail(errMsg));
    }
  };

// Get my banks (user)
export const getAllMyBanks = () => async (dispatch) => {
  try {
    dispatch(bankRequest());
    const { data } = await axios.get(`/banks/get-all-my`);
    dispatch(myBankListSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(bankFail(errMsg));
  }
};

// Get bank detail
export const getBankDetail = (bankId) => async (dispatch) => {
  try {
    dispatch(bankRequest());
    const { data } = await axios.get(`/banks/bank-show/${bankId}`);
    dispatch(bankDetailSuccess(data));
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(bankFail(errMsg));
  }
};

// Verify bank
export const verifyBank = (payload) => async (dispatch) => {
  try {
    dispatch(bankRequest());
    const { data } = await axios.put(`/banks/bank-verify`, payload);
    dispatch(bankActionSuccess(data));
    dispatch(getAllBanks());
    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.errors[0].message || error?.message;
    dispatch(bankFail(errMsg));
  }
};

// Delete bank
export const deleteBank = (bankId) => async (dispatch) => {
  try {
    dispatch(bankRequest());
    const { data } = await axios.delete(`/banks/bank-delete/${bankId}`);
    dispatch(bankActionSuccess(data));
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;
    dispatch(bankFail(errMsg));
  }
};
