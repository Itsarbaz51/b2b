import { z } from "zod";

class AuthValidationSchemas {
  static get login() {
    return z.object({
      emailOrUsername: z
        .string()
        .min(1, "Email or username is required")
        .max(255, "Email or username is too long"),
      password: z
        .string()
        .min(1, "Password is required")
        .max(255, "Password is too long"),
      latitude: z
        .number()
        .min(-90, "Invalid latitude")
        .max(90, "Invalid latitude")
        .optional(),
      longitude: z
        .number()
        .min(-180, "Invalid longitude")
        .max(180, "Invalid longitude")
        .optional(),
      accuracy: z.number().min(0, "Accuracy must be positive").optional(),
    });
  }

  static get forgotPassword() {
    return z.object({
      email: z
        .string()
        .email("Invalid email address")
        .max(255, "Email is too long"),
    });
  }

  static get updateCredentials() {
    return z
      .object({
        currentPassword: z
          .string()
          .min(1, "Current password is required")
          .max(255, "Current password is too long"),
        newPassword: z
          .string()
          .min(8, "Password must be at least 8 characters")
          .max(255, "Password is too long")
          .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
            "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
          )
          .optional(),
        confirmNewPassword: z.string().optional(),
        currentTransactionPin: z
          .string()
          .regex(/^\d{4,6}$/, "Current transaction PIN must be 4 digits")
          .optional(),
        newTransactionPin: z
          .string()
          .regex(/^\d{4,6}$/, "New transaction PIN must be 4 digits")
          .optional(),
        confirmNewTransactionPin: z.string().optional(),
      })
      .refine(
        (data) => {
          if (
            data.newPassword &&
            data.newPassword !== data.confirmNewPassword
          ) {
            return false;
          }
          return true;
        },
        {
          message: "New passwords do not match",
          path: ["confirmNewPassword"],
        }
      )
      .refine(
        (data) => {
          if (
            data.newTransactionPin &&
            data.newTransactionPin !== data.confirmNewTransactionPin
          ) {
            return false;
          }
          return true;
        },
        {
          message: "New transaction PINs do not match",
          path: ["confirmNewTransactionPin"],
        }
      )
      .refine(
        (data) => {
          return data.newPassword || data.newTransactionPin;
        },
        {
          message:
            "Either new password or new transaction PIN must be provided",
        }
      );
  }
}

export default AuthValidationSchemas;
