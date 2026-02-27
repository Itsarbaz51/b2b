import { z } from "zod";

export const requiredFileSchema = z
  .any()
  .refine((file) => !!file, "File is required")
  .refine(
    (file) =>
      ["application/pdf", "image/jpeg", "image/png"].includes(file.mimetype),
    "Only PDF or image files are allowed"
  )
  .transform((file) => ({
    ...file,
    fileType: file.mimetype === "application/pdf" ? "pdf" : "image",
  }));

export const optionalFileSchema = z
  .any()
  .optional()
  .refine(
    (file) =>
      !file ||
      ["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(
        file.mimetype
      ),
    "Only PDF or image files are allowed"
  )
  .transform((file) =>
    !file
      ? null
      : {
          ...file,
          fileType: file.mimetype === "application/pdf" ? "pdf" : "image",
        }
  );

class KycValidationSchemas {
  static get UserKyc() {
    return z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      fatherName: z.string().min(1, "Father name is required"),
      dob: z
        .string()
        .refine((val) => !isNaN(Date.parse(val)), "Invalid date format"),
      gender: z.enum(["MALE", "FEMALE", "OTHER"]),
      addressId: z.string().uuid(),
      panNumber: z.string().length(10, "PAN number must be 10 characters"),
      aadhaarNumber: z
        .string()
        .length(12, "Aadhaar number must be 12 characters"),
    });
  }

  static get VerificationKycSchema() {
    return z
      .object({
        id: z.string().uuid(),
        status: z.enum(["VERIFIED", "REJECT"]),
        kycRejectionReason: z.string(),
      })
      .refine(
        (data) => {
          if (data.status === "REJECT") {
            return !!data.kycRejectionReason?.trim();
          }
          return true;
        },
        {
          message: "Rejection reason is required when status is REJECT",
          path: ["kycRejectionReason"],
        }
      );
  }

  static get ListkycSchema() {
    return z.object({
      status: z.enum(["VERIFIED", "REJECT", "PENDING", "ALL"]).optional(),
      page: z.coerce.number().optional().default(1),
      limit: z.coerce.number().optional().default(10),
      sort: z.enum(["asc", "desc"]).optional().default("desc"),
      search: z.string().optional(),
    });
  }
}

export default KycValidationSchemas;