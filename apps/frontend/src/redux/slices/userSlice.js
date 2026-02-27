import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const initialState = {
  users: [], // Business users
  currentUser: null,
  usersByRole: [],
  childrenUsers: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  success: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: "",
    status: "ALL",
    role: "ALL",
  },
};

const userSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    // Loading states
    userRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    userSubmitRequest: (state) => {
      state.isSubmitting = true;
      state.error = null;
      state.success = null;
    },
    userSuccess: (state, action) => {
      state.isLoading = false;
      state.isSubmitting = false;
      state.success = action.payload?.message || null;
      state.error = null;
    },
    userFail: (state, action) => {
      state.isLoading = false;
      state.isSubmitting = false;
      state.error = action.payload;
    },

    // Data management
    clearUserError: (state) => {
      state.error = null;
    },
    clearUserSuccess: (state) => {
      state.success = null;
    },
    setUsers: (state, action) => {
      state.users = action.payload;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    setUsersByRole: (state, action) => {
      state.usersByRole = action.payload;
    },
    setChildrenUsers: (state, action) => {
      state.childrenUsers = action.payload;
    },

    // Update specific user in lists
    updateUserInList: (state, action) => {
      const updatedUser = action.payload;

      // Update in users array
      const userIndex = state.users.findIndex(
        (user) => user.id === updatedUser.id
      );
      if (userIndex !== -1) {
        state.users[userIndex] = { ...state.users[userIndex], ...updatedUser };
      }

      // Update in usersByRole array
      const roleIndex = state.usersByRole.findIndex(
        (user) => user.id === updatedUser.id
      );
      if (roleIndex !== -1) {
        state.usersByRole[roleIndex] = {
          ...state.usersByRole[roleIndex],
          ...updatedUser,
        };
      }

      // Update in childrenUsers array
      const childrenIndex = state.childrenUsers.findIndex(
        (user) => user.id === updatedUser.id
      );
      if (childrenIndex !== -1) {
        state.childrenUsers[childrenIndex] = {
          ...state.childrenUsers[childrenIndex],
          ...updatedUser,
        };
      }

      // Update currentUser if it's the same user
      if (state.currentUser?.id === updatedUser.id) {
        state.currentUser = { ...state.currentUser, ...updatedUser };
      }
    },

    // Pagination and filters
    updatePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setUserData: (state, action) => {
      const { users, total, page, limit, totalPages } = action.payload;
      if (users) state.users = users;
      if (total !== undefined) state.pagination.total = total;
      if (page !== undefined) state.pagination.page = page;
      if (limit !== undefined) state.pagination.limit = limit;
      if (totalPages !== undefined) state.pagination.totalPages = totalPages;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: "",
        status: "ALL",
        role: "ALL",
      };
    },
  },
});

export const {
  userRequest,
  userSubmitRequest,
  userSuccess,
  userFail,
  clearUserError,
  clearUserSuccess,
  setUsers,
  setCurrentUser,
  setUsersByRole,
  setChildrenUsers,
  updateUserInList,
  updatePagination,
  setUserData,
  setFilters,
  clearFilters,
} = userSlice.actions;

// Async Actions - BUSINESS USERS ONLY

// Register business user
export const registerUser = (userData) => async (dispatch) => {
  try {
    dispatch(userSubmitRequest());
    const config =
      userData instanceof FormData
        ? {
            headers: { "Content-Type": "multipart/form-data" },
          }
        : {};

    const { data } = await axios.post(`/users/register`, userData, config);

    dispatch(userSuccess(data));

    if (data.message) {
      toast.success(data.message || "Business user registered successfully!");
    }

    return data;
  } catch (error) {
    const errorResponse = error?.response?.data;
    dispatch(userFail(errorResponse || error.message));

    throw error;
  }
};

// Update business user profile image
export const updateUserProfileImage =
  (userId, formData) => async (dispatch) => {
    try {
      dispatch(userSubmitRequest());
      const { data } = await axios.put(
        `/users/${userId}/profile-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      dispatch(userSuccess(data));
      dispatch(updateUserInList(data.data.user));

      if (data.message) {
        toast.success(data.message || "Profile image updated successfully!");
      }

      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Profile image update failed";
      dispatch(userFail(errMsg));
      toast.error(errMsg);
      throw new Error(errMsg);
    }
  };

// Update business user profile
export const updateUserProfile = (userId, profileData) => async (dispatch) => {
  try {
    dispatch(userSubmitRequest());

    const config =
      profileData instanceof FormData
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : {};

    const { data } = await axios.put(
      `/users/${userId}/profile`,
      profileData,
      config
    );

    dispatch(userSuccess(data));
    dispatch(updateUserInList(data.data.user));

    if (data.message) {
      toast.success(data.message || "Profile updated successfully!");
    }

    return data;
  } catch (error) {
    const errorResponse = error?.response?.data;
    dispatch(userFail(errorResponse || error.message));
    throw error;
  }
};

// Get business user by ID
export const getUserById = (userId) => async (dispatch) => {
  try {
    dispatch(userRequest());
    const { data } = await axios.get(`/users/${userId}`);

    dispatch(setCurrentUser(data.data.user));
    dispatch(userSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch user";
    dispatch(userFail(errMsg));
    throw new Error(errMsg);
  }
};

// Get current business user profile
export const getCurrentUserProfile = () => async (dispatch) => {
  try {
    dispatch(userRequest());
    const { data } = await axios.get(`/users/me`);

    dispatch(setCurrentUser(data.data.user));
    dispatch(userSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch profile";
    dispatch(userFail(errMsg));
    throw new Error(errMsg);
  }
};

// Get all business users by role
export const getAllUsersByRole = (roleId) => async (dispatch) => {
  try {
    dispatch(userRequest());
    const { data } = await axios.get(`/users/role/${roleId}`);

    dispatch(setUsersByRole(data.data.users));
    dispatch(userSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch users by role";
    dispatch(userFail(errMsg));
    throw new Error(errMsg);
  }
};

// Get all business users by parent ID
export const getAllBusinessUsersByParentId =
  (filters = {}) =>
  async (dispatch) => {
    try {
      dispatch(userRequest());
      dispatch(setFilters(filters));

      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (
          filters[key] !== undefined &&
          filters[key] !== null &&
          filters[key] !== ""
        ) {
          params.append(key, filters[key]);
        }
      });

      if (!filters.page) params.append("page", "1");
      if (!filters.limit) params.append("limit", "10");
      if (!filters.sort) params.append("sort", "desc");
      if (!filters.status) params.append("status", "ALL");

      const { data } = await axios.get(`/users?${params.toString()}`);

      const requestedPage = filters.page || 1;

      dispatch(
        setUserData({
          users: data.data.users,
          total: data.data.total,
          page: data.data.page ?? requestedPage,
          limit: data.data.limit ?? filters.limit ?? 10,
          totalPages:
            data.data.totalPages ??
            Math.ceil((data.data.total || 0) / (filters.limit || 10)),
        })
      );

      dispatch(userSuccess(data));
      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message || "Failed to fetch business users";
      dispatch(userFail(errMsg));
      throw new Error(errMsg);
    }
  };

// Get all business users by children ID
export const getAllUsersByChildrenId = (userId) => async (dispatch) => {
  try {
    dispatch(userRequest());
    const { data } = await axios.get(`/users/children/${userId}`);

    dispatch(setChildrenUsers(data.data.users));
    dispatch(userSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch children users";
    dispatch(userFail(errMsg));
    throw new Error(errMsg);
  }
};

// Deactivate business user
export const deactivateUser =
  ({ userId, reason }) =>
  async (dispatch) => {
    try {
      dispatch(userSubmitRequest());

      const finalReason = reason || "Deactivated by admin";

      const { data } = await axios.patch(`/users/${userId}/deactivate`, {
        reason: finalReason,
      });

      dispatch(userSuccess(data));
      dispatch(updateUserInList(data.data.user));

      if (data.message) {
        toast.success(data.message || "User deactivated successfully!");
      }

      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to deactivate user";
      dispatch(userFail(errMsg));
      toast.error(errMsg);
      throw new Error(errMsg);
    }
  };

// Reactivate business user
export const reactivateUser =
  ({ userId, reason }) =>
  async (dispatch) => {
    try {
      dispatch(userSubmitRequest());

      const finalReason = reason || "Reactivated by admin";

      const { data } = await axios.patch(`/users/${userId}/reactivate`, {
        reason: finalReason,
      });

      dispatch(userSuccess(data));
      dispatch(updateUserInList(data.data.user));

      if (data.message) {
        toast.success(data.message || "User reactivated successfully!");
      }

      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to reactivate user";
      dispatch(userFail(errMsg));
      toast.error(errMsg);
      throw new Error(errMsg);
    }
  };

// Delete business user (soft delete)
export const deleteUser =
  ({ userId, reason }) =>
  async (dispatch) => {
    try {
      dispatch(userSubmitRequest());

      const finalReason = reason || "Deleted by admin";

      const { data } = await axios.delete(`/users/${userId}/delete`, {
        data: { reason: finalReason },
      });

      dispatch(userSuccess(data));
      dispatch(updateUserInList(data.data.user));

      if (data.message) {
        toast.success(data.message || "User deleted successfully!");
      }

      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete user";
      dispatch(userFail(errMsg));
      toast.error(errMsg);
      throw new Error(errMsg);
    }
  };

export default userSlice.reducer;
