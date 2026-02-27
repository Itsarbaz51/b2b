import { z } from "zod";

class EmployeeValidationSchemas {
  static get register() {
    return z.object({
      username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username cannot exceed 30 characters")
        .regex(
          /^[a-zA-Z0-9_]+$/,
          "Username can only contain letters, numbers, and underscores"
        )
        .transform((val) => val.trim()),
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      email: z.string().email("Invalid email address"),
      phoneNumber: z
        .string()
        .regex(/^\d{10}$/, "Phone number must be 10 digits"),
      roleId: z.string().uuid("Invalid role ID"),
      permissions: z
        .array(z.string())
        .min(1, "At least one permission is required")
        .max(20, "Cannot assign more than 20 permissions")
        .optional()
        .default([]),
    });
  }

  static get updateProfile() {
    return z.object({
      username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .max(30, "Username cannot exceed 30 characters")
        .regex(
          /^[a-zA-Z0-9_]+$/,
          "Username can only contain letters, numbers, and underscores"
        )
        .transform((val) => val.trim())
        .optional(),
      firstName: z.string().min(1, "First name is required").optional(),
      lastName: z.string().min(1, "Last name is required").optional(),
      phoneNumber: z
        .string()
        .regex(/^\d{10}$/, "Phone number must be 10 digits")
        .optional(),
      email: z.string().email("Invalid email address").optional(),
      roleId: z.string().uuid("Invalid role ID").optional(),
    });
  }

  static get updateProfileImage() {
    return z.object({});
  }

  static get updatePermissions() {
    return z.object({
      permissions: z
        .array(z.string())
        .max(20, "Cannot assign more than 20 permissions"),
    });
  }

  static get deactivateEmployee() {
    return z.object({
      reason: z
        .string()
        .min(1, "Reason is required")
        .max(500, "Reason cannot exceed 500 characters")
        .optional()
        .default("Deactivated by admin"),
    });
  }

  static get reactivateEmployee() {
    return z.object({
      reason: z
        .string()
        .min(1, "Reason is required")
        .max(500, "Reason cannot exceed 500 characters")
        .optional()
        .default("Reactivated by admin"),
    });
  }

  static get deleteEmployee() {
    return z.object({
      reason: z
        .string()
        .min(1, "Reason is required")
        .max(500, "Reason cannot exceed 500 characters")
        .optional()
        .default("Deleted by admin"),
    });
  }

  static get checkPermission() {
    return z.object({
      permission: z.string().min(1, "Permission is required"),
    });
  }

  static get checkPermissions() {
    return z.object({
      permissions: z
        .array(z.string())
        .min(1, "At least one permission is required")
        .max(20, "Cannot check more than 20 permissions"),
    });
  }
}

export default EmployeeValidationSchemas;
