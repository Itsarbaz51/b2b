import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const initialState = {
  isLoading: false,
  error: null,
  success: null,
};

const bankVerificationSlice = createSlice({
  name: "bankVerification",
  initialState,

  reducers: {
    bankVerificationRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },

    bankVerificationSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || "Account verified";
      state.error = null;
    },

    bankVerificationFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    clearBankVerificationError: (state) => {
      state.error = null;
    },

    clearBankVerificationSuccess: (state) => {
      state.success = null;
    },
  },
});

export const {
  bankVerificationRequest,
  bankVerificationSuccess,
  bankVerificationFail,
  clearBankVerificationError,
  clearBankVerificationSuccess,
} = bankVerificationSlice.actions;

export default bankVerificationSlice.reducer;

/*
--------------------------------
VERIFY BANK ACCOUNT
--------------------------------
*/

export const verifyBankAccount = (payload) => async (dispatch) => {
  try {
    dispatch(bankVerificationRequest());

    const { data } = await axios.post(`/bank-verification`, payload);

    dispatch(bankVerificationSuccess(data));

    toast.success(data?.message || "Account verified");

    return data;
  } catch (error) {
    const errMsg = error?.response?.data?.message || error?.message;

    dispatch(bankVerificationFail(errMsg));
    toast.error(errMsg);

    throw error;
  }
};
