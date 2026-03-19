import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import { getUserById } from "./userSlice";

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

const initialState = {
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
      state.success = action.payload?.message || "Success";
      state.error = null;

      toast.success(state.success);
    },

    walletFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload || "Something went wrong";

      toast.error(state.error);
    },

    clearWalletState: (state) => {
      state.error = null;
      state.success = null;
    },
  },
});

export const { walletRequest, walletSuccess, walletFail, clearWalletState } =
  walletSlice.actions;

export default walletSlice.reducer;

export const transferCommissionToPrimary = (payload) => async (dispatch) => {
  try {
    dispatch(walletRequest());

    const { data } = await axios.post(
      "/wallet/transfer/commission-to-primary",
      payload,
    );

    dispatch(walletSuccess(data));
    await dispatch(getUserById());

    return data;
  } catch (error) {
    console.log(error);

    const errMsg = error?.response?.data?.message || error?.message || "Failed";

    dispatch(walletFail(errMsg));
    throw error;
  }
};
