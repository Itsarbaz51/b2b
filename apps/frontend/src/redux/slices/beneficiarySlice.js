import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import ZodErrorCatch from "../../layouts/ZodErrorCatch";

const initialState = {
  beneficiaries: [],
  isLoading: false,
  error: null,
};

const beneficiarySlice = createSlice({
  name: "beneficiary",
  initialState,

  reducers: {
    beneficiaryRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    beneficiarySuccess: (state, action) => {
      state.isLoading = false;
      state.beneficiaries = action.payload || [];
    },

    beneficiaryFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    },

    clearBeneficiaries: (state) => {
      state.beneficiaries = [];
    },
  },
});

export const {
  beneficiaryRequest,
  beneficiarySuccess,
  beneficiaryFail,
  clearBeneficiaries,
} = beneficiarySlice.actions;

export default beneficiarySlice.reducer;

// FETCH BENEFICIARIES (BY MOBILE)
export const fetchBeneficiaries = (mobile) => async (dispatch) => {
  try {
    dispatch(beneficiaryRequest());

    const { data } = await axios.get(`/beneficiary?mobile=${mobile}`);
    dispatch(beneficiarySuccess(data?.data || []));
    

    return data;
  } catch (error) {
    const errMsg = ZodErrorCatch(error);
    dispatch(beneficiaryFail(errMsg));
    toast.error(errMsg);
  }
};
