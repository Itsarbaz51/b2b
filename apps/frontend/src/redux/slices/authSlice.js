import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Configure axios once
if (!axios.defaults.baseURL) {
  axios.defaults.withCredentials = true;
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  axios.defaults.baseURL = baseURL;
}

const initialState = {
  currentUser: null,
  isLoading: true,
  error: null,
  success: null,
  isAuthenticated: false,
  userType: null, // 'business' or 'employee'
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    authRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    authSuccess: (state, action) => {
      state.isLoading = false;

      // Handle different response structures
      let userData;
      if (action.payload?.user) {
        userData = action.payload.user;
      } else if (action.payload?.data?.user) {
        userData = action.payload.data.user;
      } else {
        userData = action.payload;
      }

      if (userData) {
        state.currentUser = userData;
        state.userType = userData.roleType || userData.role?.type || "business";

        // Ensure permissions are included for employee users
        if (userData.role?.type === "employee" && !userData.permissions) {
          state.currentUser.permissions = userData.permissions || [];
        }
      }

      state.success =
        action.payload?.message || action.payload?.data?.message || null;
      state.error = null;
      state.isAuthenticated = true;
    },
    authFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;

      const logoutErrors = [
        "Not authenticated",
        "Unauthorized",
        "Invalid token",
        "Token expired",
        "Access denied",
      ];

      if (
        logoutErrors.some((logoutError) =>
          action.payload?.includes(logoutError)
        )
      ) {
        // Real auth error → logout user
        state.isAuthenticated = false;
        state.currentUser = null;
        state.userType = null;
      } else {
        // Stay logged in for normal business logic errors
        state.isAuthenticated = true;
      }

      if (action.payload) {
        toast.error(action.payload);
      }
    },
    credentialsUpdateRequest: (state) => {
      state.error = null;
      state.success = null;
    },
    credentialsUpdateSuccess: (state, action) => {
      state.success =
        action.payload?.message || "Credentials updated successfully";
      state.error = null;
    },
    credentialsUpdateFail: (state, action) => {
      state.error = action.payload;
      state.success = null;

      if (action.payload) {
        toast.error(action.payload);
      }
    },
    logoutUser: (state) => {
      state.currentUser = null;
      state.isLoading = false;
      state.isAuthenticated = false;
      state.success = null;
      state.error = null;
      state.userType = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearSuccess: (state) => {
      state.success = null;
    },
    updateUser: (state, action) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
    setAuthentication: (state, action) => {
      state.isAuthenticated = action.payload;
      if (!action.payload) {
        state.currentUser = null;
        state.userType = null;
      }
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    clearAuthState: (state) => {
      state.currentUser = null;
      state.isLoading = false;
      state.isAuthenticated = false;
      state.success = null;
      state.error = null;
      state.userType = null;
    },
    setUserType: (state, action) => {
      state.userType = action.payload;
    },
    updateUserPermissions: (state, action) => {
      if (state.currentUser) {
        state.currentUser.userPermissions = action.payload;
        state.currentUser.permissions = action.payload;
      }
    },
  },
});

export const {
  authRequest,
  authSuccess,
  authFail,
  credentialsUpdateRequest,
  credentialsUpdateSuccess,
  credentialsUpdateFail,
  logoutUser,
  clearError,
  clearSuccess,
  updateUser,
  setAuthentication,
  setLoading,
  clearAuthState,
  setUserType,
  updateUserPermissions,
} = authSlice.actions;

// Async Actions
export const login = (credentials) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.post(`/auth/login`, credentials);

    dispatch(setAuthentication(true));
    dispatch(authSuccess(data));
    toast.success("Login successful");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message || error?.message || "Login failed";
    dispatch(setAuthentication(false));
    dispatch(authFail(errMsg));
    throw error;
  }
};

export const logout = () => async (dispatch) => {
  try {
    dispatch(authRequest());
    await axios.post(`/auth/logout`);

    dispatch(setAuthentication(false));
    dispatch(logoutUser());
    toast.success("Logout successful");
  } catch (error) {
    const errMsg =
      error?.response?.data?.message || error?.message || "Logout failed";
    dispatch(setAuthentication(false));
    dispatch(logoutUser());
    dispatch(authFail(errMsg));
  }
};

export const refreshToken = () => async (dispatch) => {
  try {
    const { data } = await axios.post(`/auth/refresh`);
    dispatch(setAuthentication(true));
    dispatch(authSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Token refresh failed";
    dispatch(setAuthentication(false));
    throw error;
  }
};

export const verifyAuth = () => async (dispatch) => {
  dispatch(setLoading(true));
  try {
    const { data } = await axios.get(`/auth/me`);
    dispatch(setAuthentication(true));
    dispatch(authSuccess(data));
    return data;
  } catch (error) {
    dispatch(setAuthentication(false));
    dispatch(logoutUser());
  } finally {
    dispatch(setLoading(false));
  }
};

export const updateCredentials =
  (userId, credentialsData) => async (dispatch) => {
    try {
      dispatch(credentialsUpdateRequest());

      const { data } = await axios.put(
        `/auth/${userId}/credentials`,
        credentialsData
      );

      dispatch(credentialsUpdateSuccess(data));
      toast.success("Credentials updated successfully");
      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Credentials update failed";
      dispatch(credentialsUpdateFail(errMsg));
      throw error;
    }
  };

export const passwordReset = (email) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.post(`/auth/password-reset`, { email });
    dispatch(authSuccess(data));
    toast.success(data.message || "Password reset email sent");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Password reset failed";
    dispatch(authFail(errMsg));
    throw error;
  }
};

export const verifyPasswordReset = (token) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.get(
      `/auth/verify-password-reset?token=${token}`
    );
    dispatch(authSuccess(data));
    toast.success(data.message || "Password reset successful");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Password reset failed";
    dispatch(authFail(errMsg));
    throw error;
  }
};

export const verifyEmail = (token) => async (dispatch) => {
  try {
    dispatch(authRequest());
    const { data } = await axios.get(`/auth/verify-email?token=${token}`);
    dispatch(authSuccess(data));
    toast.success(data.message || "Email verified successfully");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Email verification failed";
    dispatch(authFail(errMsg));
    throw error;
  }
};

// Selectors for better state access
export const selectCurrentUser = (state) => state.auth.currentUser;
export const selectUserPermissions = (state) =>
  state.auth.currentUser?.userPermissions || [];
export const selectIsEmployee = (state) =>
  state.auth.currentUser?.role?.type === "employee";

export default authSlice.reducer;
