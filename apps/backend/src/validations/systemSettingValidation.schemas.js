import { z } from "zod";

const optionalFileSchema = z
  .any()
  .optional()
  .refine(
    (file) =>
      !file ||
      ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(
        file.mimetype
      ),
    "Only image files are allowed"
  )
  .transform((file) => (file ? file : null));

export default class SystemSettingValidationSchemas {
  static get createSchema() {
    return z.object({
      companyName: z.string().min(2, "Company name is required"),
      phoneNumber: z.string().min(5, "Phone number is required"),
      whtsappNumber: z.string().min(5, "Whatsapp number is required"),
      companyEmail: z.string().email("Invalid email address"),
      companyLogo: optionalFileSchema,
      favIcon: optionalFileSchema,
      facebookUrl: z.string().url().optional(),
      instagramUrl: z.string().url().optional(),
      twitterUrl: z.string().url().optional(),
      linkedinUrl: z.string().url().optional(),
      websiteUrl: z.string().url().optional(),
    });
  }

  static get updateSchema() {
    return this.createSchema.partial();
  }

  static get upsertSchema() {
    return this.createSchema.partial();
  }
}