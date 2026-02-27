import { z } from "zod";

class RoleValidationSchemas {
  static get createRole() {
    return z.object({
      name: z
        .string()
        .trim()
        .min(1, "Role name is required")
        .max(50, "Role name is too long")
        .regex(/^[A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)*$/, {
          message: 'Role name must start with capital letters (e.g. "Admin")',
        }),
      description: z.string().trim().max(2000).nullable().optional(),
      level: z.number().int().positive().optional(),
      type: z.enum(["employee"]).default("employee"), // Only allow employee type
    });
  }

  static get updateRole() {
    return z.object({
      name: z
        .string()
        .trim()
        .min(1, "Role name is required")
        .max(50, "Role name is too long")
        .regex(/^[A-Z][A-Za-z]*(?:\s+[A-Z][A-Za-z]*)*$/, {
          message: 'Role name must start with capital letters (e.g. "Admin")',
        })
        .optional(),
      description: z.string().trim().max(2000).nullable().optional(),
      level: z.number().int().positive().optional(),
      type: z.enum(["employee"]).optional(), // Only allow employee type
    });
  }
}

export default RoleValidationSchemas;
