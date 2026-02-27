// employeeSlice.js
import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const initialState = {
  employees: [],
  currentEmployee: null,
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
  },
  permissions: [],
  permissionCheck: {
    single: null,
    multiple: null,
    isLoading: false,
  },
};

const employeeSlice = createSlice({
  name: "employees",
  initialState,
  reducers: {
    // Loading states
    employeeRequest: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    employeeSubmitRequest: (state) => {
      state.isSubmitting = true;
      state.error = null;
      state.success = null;
    },
    employeeSuccess: (state, action) => {
      state.isLoading = false;
      state.isSubmitting = false;
      state.success = action.payload?.message || null;
      state.error = null;
    },
    employeeFail: (state, action) => {
      state.isLoading = false;
      state.isSubmitting = false;
      state.error = action.payload;
    },

    // Permission specific states
    permissionCheckRequest: (state) => {
      state.permissionCheck.isLoading = true;
    },
    permissionCheckSuccess: (state, action) => {
      state.permissionCheck.isLoading = false;
      state.success = action.payload?.message || null;
    },
    permissionCheckFail: (state, action) => {
      state.permissionCheck.isLoading = false;
      state.error = action.payload;
    },

    // Data management
    clearEmployeeError: (state) => {
      state.error = null;
    },
    clearEmployeeSuccess: (state) => {
      state.success = null;
    },
    setEmployees: (state, action) => {
      state.employees = action.payload;
    },
    setCurrentEmployee: (state, action) => {
      state.currentEmployee = action.payload;
    },
    setEmployeePermissions: (state, action) => {
      state.permissions = action.payload;
    },
    setSinglePermissionCheck: (state, action) => {
      state.permissionCheck.single = action.payload;
    },
    setMultiplePermissionCheck: (state, action) => {
      state.permissionCheck.multiple = action.payload;
    },
    clearPermissionCheck: (state) => {
      state.permissionCheck.single = null;
      state.permissionCheck.multiple = null;
    },

    // Update specific employee in list
    updateEmployeeInList: (state, action) => {
      const updatedEmployee = action.payload;
      const index = state.employees.findIndex(
        (employee) => employee.id === updatedEmployee.id
      );
      if (index !== -1) {
        state.employees[index] = {
          ...state.employees[index],
          ...updatedEmployee,
        };
      }

      // Update current employee if it's the same
      if (state.currentEmployee?.id === updatedEmployee.id) {
        state.currentEmployee = {
          ...state.currentEmployee,
          ...updatedEmployee,
        };
      }
    },

    // Pagination and filters
    updateEmployeePagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setEmployeeData: (state, action) => {
      const { employees, total, page, limit, totalPages } = action.payload;
      if (employees) state.employees = employees;
      if (total !== undefined) state.pagination.total = total;
      if (page !== undefined) state.pagination.page = page;
      if (limit !== undefined) state.pagination.limit = limit;
      if (totalPages !== undefined) state.pagination.totalPages = totalPages;
    },
    setEmployeeFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearEmployeeFilters: (state) => {
      state.filters = {
        search: "",
        status: "ALL",
      };
    },
  },
});

export const {
  employeeRequest,
  employeeSubmitRequest,
  employeeSuccess,
  employeeFail,
  permissionCheckRequest,
  permissionCheckSuccess,
  permissionCheckFail,
  clearEmployeeError,
  clearEmployeeSuccess,
  setEmployees,
  setCurrentEmployee,
  setEmployeePermissions,
  setSinglePermissionCheck,
  setMultiplePermissionCheck,
  clearPermissionCheck,
  updateEmployeeInList,
  updateEmployeePagination,
  setEmployeeData,
  setEmployeeFilters,
  clearEmployeeFilters,
} = employeeSlice.actions;

// Async Actions - EMPLOYEES ONLY

// Register employee
export const registerEmployee = (employeeData) => async (dispatch) => {
  try {
    dispatch(employeeSubmitRequest());
    const config =
      employeeData instanceof FormData
        ? {
            headers: { "Content-Type": "multipart/form-data" },
          }
        : {};

    const { data } = await axios.post(
      `/employees/register`,
      employeeData,
      config
    );

    dispatch(employeeSuccess(data));

    if (data.message) {
      toast.success(data.message || "Employee registered successfully!");
    }

    return data;
  } catch (error) {
    const errorResponse = error?.response?.data;
    dispatch(employeeFail(errorResponse || error.message));
    throw error;
  }
};

// Get all employees by parent ID
export const getAllEmployeesByParentId =
  (filters = {}) =>
  async (dispatch) => {
    try {
      dispatch(employeeRequest());
      dispatch(setEmployeeFilters(filters));

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

      const { data } = await axios.get(`/employees?${params.toString()}`);

      const requestedPage = filters.page || 1;
      const requestedLimit = filters.limit || 10;

      dispatch(
        setEmployeeData({
          employees: data.data.users || data.data.employees || [],
          total: data.data.total,
          page: data.data.page ?? requestedPage,
          limit: data.data.limit ?? requestedLimit,
          totalPages:
            data.data.totalPages ??
            Math.ceil((data.data.total || 0) / requestedLimit),
        })
      );

      dispatch(employeeSuccess(data));
      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message || "Failed to fetch employees";
      dispatch(employeeFail(errMsg));
      throw new Error(errMsg);
    }
  };

// Get employee by ID
export const getEmployeeById = (employeeId) => async (dispatch) => {
  try {
    dispatch(employeeRequest());
    const { data } = await axios.get(`/employees/${employeeId}`);

    dispatch(setCurrentEmployee(data.data.user || data.data.employee));
    dispatch(employeeSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch employee";
    dispatch(employeeFail(errMsg));
    throw new Error(errMsg);
  }
};

// Update employee profile
export const updateEmployeeProfile =
  (employeeId, profileData) => async (dispatch) => {
    try {
      dispatch(employeeSubmitRequest());

      const config =
        profileData instanceof FormData
          ? { headers: { "Content-Type": "multipart/form-data" } }
          : {};

      const { data } = await axios.put(
        `/employees/${employeeId}/profile`,
        profileData,
        config
      );

      dispatch(employeeSuccess(data));
      dispatch(updateEmployeeInList(data.data.user || data.data.employee));

      if (data.message) {
        toast.success(data.message || "Employee profile updated successfully!");
      }

      return data;
    } catch (error) {
      const errorResponse = error?.response?.data;
      dispatch(employeeFail(errorResponse || error.message));
      throw error;
    }
  };

// Update employee profile image
export const updateEmployeeProfileImage =
  (employeeId, formData) => async (dispatch) => {
    try {
      dispatch(employeeSubmitRequest());
      const { data } = await axios.put(
        `/employees/${employeeId}/profile-image`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      dispatch(employeeSuccess(data));
      dispatch(updateEmployeeInList(data.data.user || data.data.employee));

      if (data.message) {
        toast.success(
          data.message || "Employee profile image updated successfully!"
        );
      }

      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Employee profile image update failed";
      dispatch(employeeFail(errMsg));
      toast.error(errMsg);
      throw new Error(errMsg);
    }
  };

// ✅ NEW: Update employee permissions
export const updateEmployeePermissions =
  (employeeId, permissions) => async (dispatch) => {
    try {
      dispatch(employeeSubmitRequest());
      const { data } = await axios.put(`/employees/${employeeId}/permissions`, {
        permissions,
      });

      dispatch(employeeSuccess(data));
      dispatch(setEmployeePermissions(permissions));

      if (data.message) {
        toast.success(
          data.message || "Employee permissions updated successfully!"
        );
      }

      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to update employee permissions";
      dispatch(employeeFail(errMsg));
      throw new Error(errMsg);
    }
  };

// ✅ NEW: Get employee permissions
export const getEmployeePermissions = (employeeId) => async (dispatch) => {
  try {
    dispatch(employeeRequest());
    const { data } = await axios.get(`/employees/${employeeId}/permissions`);

    dispatch(setEmployeePermissions(data.data.permissions || []));
    dispatch(employeeSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch employee permissions";
    dispatch(employeeFail(errMsg));
    throw new Error(errMsg);
  }
};

// Deactivate employee
export const deactivateEmployee =
  ({ employeeId, reason }) =>
  async (dispatch) => {
    try {
      dispatch(employeeSubmitRequest());

      const finalReason = reason || "Deactivated by admin";

      const { data } = await axios.patch(
        `/employees/${employeeId}/deactivate`,
        {
          reason: finalReason,
        }
      );

      dispatch(employeeSuccess(data));
      dispatch(updateEmployeeInList(data.data.user || data.data.employee));

      if (data.message) {
        toast.success(data.message || "Employee deactivated successfully!");
      }

      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to deactivate employee";
      dispatch(employeeFail(errMsg));
      toast.error(errMsg);
      throw new Error(errMsg);
    }
  };

// Reactivate employee
export const reactivateEmployee =
  ({ employeeId, reason }) =>
  async (dispatch) => {
    try {
      dispatch(employeeSubmitRequest());

      const finalReason = reason || "Reactivated by admin";

      const { data } = await axios.patch(
        `/employees/${employeeId}/reactivate`,
        {
          reason: finalReason,
        }
      );

      dispatch(employeeSuccess(data));
      dispatch(updateEmployeeInList(data.data.user || data.data.employee));

      if (data.message) {
        toast.success(data.message || "Employee reactivated successfully!");
      }

      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to reactivate employee";
      dispatch(employeeFail(errMsg));
      toast.error(errMsg);
      throw new Error(errMsg);
    }
  };

// Delete employee (permanent delete)
export const deleteEmployee =
  ({ employeeId, reason }) =>
  async (dispatch) => {
    try {
      dispatch(employeeSubmitRequest());

      const finalReason = reason || "Deleted by admin";

      const { data } = await axios.delete(`/employees/${employeeId}/delete`, {
        data: { reason: finalReason },
      });

      dispatch(employeeSuccess(data));

      if (data.message) {
        toast.success(data.message || "Employee deleted successfully!");
      }

      return data;
    } catch (error) {
      const errMsg =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to delete employee";
      dispatch(employeeFail(errMsg));
      toast.error(errMsg);
      throw new Error(errMsg);
    }
  };

export default employeeSlice.reducer;
