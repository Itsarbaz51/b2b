// roleSlice.js
import { createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { toast } from "react-toastify";

const initialState = {
  roles: [],
  businessRoles: [],
  employeeRoles: [],
  currentRole: null,
  isLoading: false,
  error: null,
  success: null,
};

const roleSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    roleRequest: (state) => {
      state.isLoading = true;
      state.error = null;
      state.success = null;
    },
    roleSuccess: (state, action) => {
      state.isLoading = false;
      state.success = action.payload?.message || null;
      state.error = null;
    },
    roleFail: (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
      if (action.payload) {
        toast.error(action.payload);
      }
    },
    clearRoleError: (state) => {
      state.error = null;
    },
    clearRoleSuccess: (state) => {
      state.success = null;
    },
    setRoles: (state, action) => {
      state.roles = action.payload;
    },
    setBusinessRoles: (state, action) => {
      state.businessRoles = action.payload;
    },
    setEmployeeRoles: (state, action) => {
      state.employeeRoles = action.payload;
    },
    setCurrentRole: (state, action) => {
      state.currentRole = action.payload;
    },
    addRole: (state, action) => {
      const newRole = action.payload;
      state.roles.push(newRole);
      // Add to appropriate list based on type
      if (newRole.type === "employee") {
        state.employeeRoles.push(newRole);
      } else if (newRole.type === "business") {
        state.businessRoles.push(newRole);
      }
    },
    updateRoleInList: (state, action) => {
      const updatedRole = action.payload;

      // Update in main roles array
      const index = state.roles.findIndex((role) => role.id === updatedRole.id);
      if (index !== -1) {
        state.roles[index] = updatedRole;
      }

      // Update in specific arrays based on type
      if (updatedRole.type === "employee") {
        const employeeIndex = state.employeeRoles.findIndex(
          (role) => role.id === updatedRole.id
        );
        if (employeeIndex !== -1) {
          state.employeeRoles[employeeIndex] = updatedRole;
        }
      } else if (updatedRole.type === "business") {
        const businessIndex = state.businessRoles.findIndex(
          (role) => role.id === updatedRole.id
        );
        if (businessIndex !== -1) {
          state.businessRoles[businessIndex] = updatedRole;
        }
      }
    },
    removeRoleFromList: (state, action) => {
      const roleId = action.payload;
      const roleToDelete = state.roles.find((role) => role.id === roleId);

      state.roles = state.roles.filter((role) => role.id !== roleId);

      // Remove from specific arrays based on type
      if (roleToDelete?.type === "employee") {
        state.employeeRoles = state.employeeRoles.filter(
          (role) => role.id !== roleId
        );
      } else if (roleToDelete?.type === "business") {
        state.businessRoles = state.businessRoles.filter(
          (role) => role.id !== roleId
        );
      }
    },
  },
});

export const {
  roleRequest,
  roleSuccess,
  roleFail,
  clearRoleError,
  clearRoleSuccess,
  setRoles,
  setBusinessRoles,
  setEmployeeRoles,
  setCurrentRole,
  addRole,
  updateRoleInList,
  removeRoleFromList,
} = roleSlice.actions;

// Async action creators

// Get all roles (employee/business)
export const getAllRoles = () => async (dispatch) => {
  try {
    dispatch(roleRequest());
    const { data } = await axios.get(`/roles`);

    const roles = data.data?.roles || data.data || [];

    dispatch(setRoles(roles));

    // Separate roles by type
    const businessRoles = roles.filter((role) => role.type === "business");
    const employeeRoles = roles.filter((role) => role.type === "employee");

    dispatch(setBusinessRoles(businessRoles));
    dispatch(setEmployeeRoles(employeeRoles));

    dispatch(roleSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch roles";
    dispatch(roleFail(errMsg));
    throw new Error(errMsg);
  }
};

// Get all roles by type (employee/business)
export const getAllRolesByType = (type) => async (dispatch) => {
  try {
    dispatch(roleRequest());
    const { data } = await axios.get(`/roles/type/${type}`);

    const roles = data.data?.roles || data.data || [];

    if (type === "business") {
      dispatch(setBusinessRoles(roles));
    } else if (type === "employee") {
      dispatch(setEmployeeRoles(roles));
    }

    // Also update the main roles array
    dispatch(setRoles(roles));
    dispatch(roleSuccess(data));
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to fetch roles";
    dispatch(roleFail(errMsg));
    throw new Error(errMsg);
  }
};

// Create new role
export const createRole = (roleData) => async (dispatch) => {
  try {
    dispatch(roleRequest());
    const { data } = await axios.post(`/roles`, roleData);

    dispatch(addRole(data.data));
    dispatch(roleSuccess(data));

    toast.success(data.message || "Role created successfully");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to create role";
    dispatch(roleFail(errMsg));
    throw new Error(errMsg);
  }
};

// Update role
export const updateRole = (roleId, roleData) => async (dispatch) => {
  try {
    dispatch(roleRequest());
    const { data } = await axios.put(`/roles/${roleId}`, roleData);

    dispatch(updateRoleInList(data.data));
    dispatch(roleSuccess(data));

    toast.success(data.message || "Role updated successfully");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to update role";
    dispatch(roleFail(errMsg));
    throw new Error(errMsg);
  }
};

// Delete role
export const deleteRole = (roleId) => async (dispatch) => {
  try {
    dispatch(roleRequest());
    const { data } = await axios.delete(`/roles/${roleId}`);

    dispatch(removeRoleFromList(roleId));
    dispatch(roleSuccess(data));
    toast.success(data.message || "Role deleted successfully");
    return data;
  } catch (error) {
    const errMsg =
      error?.response?.data?.message ||
      error?.message ||
      "Failed to delete role";
    dispatch(roleFail(errMsg));
    throw new Error(errMsg);
  }
};

export default roleSlice.reducer;
