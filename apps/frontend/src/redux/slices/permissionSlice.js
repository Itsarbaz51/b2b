import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

// Axios setup
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;

// Initial state
const initialState = {
  permissions: [],
  currentPermission: null,
  isLoading: false,
  error: null,
  success: null,
};

const permissionSlice = createSlice({
  name: "permissions",
  initialState,
  reducers: {
    permissionRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    permissionSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || null;
      state.error = null;
    },
    permissionFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) toast.error(action.payload);
    },
    clearPermissionError: (state) => {
      state.error = null;
    },
    clearPermissionSuccess: (state) => {
      state.success = null;
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload || [];
    },
    setCurrentPermission: (state, action) => {
      state.currentPermission = action.payload || null;
    },
    addPermission: (state, action) => {
      const exists = state.permissions.some((p) => p.id === action.payload?.id);
      if (!exists) {
        state.permissions.push(action.payload);
      } else {
        const index = state.permissions.findIndex(
          (p) => p.id === action.payload?.id
        );
        if (index !== -1) state.permissions[index] = action.payload;
      }
    },
    updatePermissionInList: (state, action) => {
      const updated = action.payload;
      const index = state.permissions.findIndex((p) => p.id === updated.id);
      if (index !== -1) {
        state.permissions[index] = updated;
      }
    },
    removePermissionFromList: (state, action) => {
      state.permissions = state.permissions.filter(
        (p) => p.id !== action.payload
      );
    },
  },
});

export const {
  permissionRequest,
  permissionSuccess,
  permissionFail,
  clearPermissionError,
  clearPermissionSuccess,
  setPermissions,
  setCurrentPermission,
  addPermission,
  updatePermissionInList,
  removePermissionFromList,
} = permissionSlice.actions;

/* ========================= USER PERMISSIONS ========================= */

// Fetch user permission by userId
export const getPermissionById = (userId) => async (dispatch) => {
  try {
    dispatch(permissionRequest());
    const { data } = await axios.get(`permissions/user-permission/${userId}`);
    dispatch(setCurrentPermission(data.data));
    dispatch(permissionSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch user permission";
    dispatch(permissionFail(errMsg));
    throw new Error(errMsg);
  }
};

// Upsert user permission
export const upsertPermission = (permissionData) => async (dispatch) => {
  try {
    dispatch(permissionRequest());
    const { data } = await axios.post(
      `permissions/user-upsert`,
      permissionData
    );
    dispatch(addPermission(data.data));
    dispatch(permissionSuccess(data));
    toast.success(data.message || "User permission saved");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to upsert user permission";
    dispatch(permissionFail(errMsg));
    throw new Error(errMsg);
  }
};

/* ========================= ROLE PERMISSIONS ========================= */

// Fetch role permission by roleId
export const getPermissionRoleById = (roleId) => async (dispatch) => {
  try {
    dispatch(permissionRequest());
    const { data } = await axios.get(`/permissions/role-permission/${roleId}`);
    dispatch(setCurrentPermission(data.data));
    dispatch(permissionSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch role permission";
    dispatch(permissionFail(errMsg));
    throw new Error(errMsg);
  }
};

// Upsert role permission
export const upsertRolePermission = (permissionData) => async (dispatch) => {
  try {
    dispatch(permissionRequest());
    const { data } = await axios.post(
      `permissions/role-upsert`,
      permissionData
    );
    dispatch(addPermission(data.data));
    dispatch(permissionSuccess(data));
    toast.success(data.message || "Role permission saved");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to upsert role permission";
    dispatch(permissionFail(errMsg));
    throw new Error(errMsg);
  }
};

export default permissionSlice.reducer;
