import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import kycReducer from "./slices/kycSlice.js";
import userReducer from "./slices/userSlice.js";
import employeeReducer from "./slices/employeeSlice.js";
import bankReducer from "./slices/bankSlice.js";
import walletReducer from "./slices/walletSlice.js";
import commissionReducer from "./slices/commissionSlice.js";
import roleReducer from "./slices/roleSlice.js";
import AddressReducer from "./slices/addressSlice.js";
import serviceReducer from "./slices/serviceSlice.js";
import permissionReducer from "./slices/permissionSlice.js";
import loginLogsReducer from "./slices/logsSlice.js";
import settingReducer from "./slices/settingSlice.js";
import aadhaarReducer from "./slices/aadhaarSlice.js";
import transactionReducer from "./slices/transactionSlice.js";
import dashboardReducer from "./slices/dashboardSlice.js";
import ledgerReducer from "./slices/ledgerSlice.js";
import reportReducer from "./slices/reportSlice.js";
import bankVerificationReducer from "./slices/bankVerificationSlice.js";

const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    employees: employeeReducer,
    kyc: kycReducer,
    address: AddressReducer,
    bank: bankReducer,
    wallet: walletReducer,
    roles: roleReducer,
    commission: commissionReducer,
    service: serviceReducer,
    permission: permissionReducer,
    logs: loginLogsReducer,
    setting: settingReducer,
    aadhaar: aadhaarReducer,
    transaction: transactionReducer,
    dashboard: dashboardReducer,
    ledger: ledgerReducer,
    report: reportReducer,
    bankVerification: bankVerificationReducer,
  },
});

export default store;
