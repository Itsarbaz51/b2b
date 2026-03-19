import { z } from "zod";
export class ServiceValidationSchemas {
  static get create() {
    return (
      z
        .object({
          type: z.enum(["service", "provider", "mapping", "slab"]),

          // 🔹 Common
          name: z.string().min(2).optional(),
          code: z.string().min(2).optional(),

          // 🔹 Mapping
          serviceId: z.string().uuid().optional(),
          providerId: z.string().uuid().optional(),

          providerCost: z.coerce.number().min(0).optional(),
          sellingPrice: z.coerce.number().min(0).optional(),

          mode: z.enum(["SURCHARGE", "COMMISSION"]).optional(),
          pricingValueType: z.enum(["PERCENTAGE", "FLAT"]).optional(),
          supportsSlab: z.boolean().optional(),

          commissionStartLevel: z
            .enum(["NONE", "ADMIN_ONLY", "HIERARCHY"])
            .optional(),

          // 🔥 GST / TDS
          applyGST: z.boolean().optional(),
          gstPercent: z.coerce.number().min(0).max(100).optional(),

          applyTDS: z.boolean().optional(),
          tdsPercent: z.coerce.number().min(0).max(100).optional(),

          // 🔹 Slab
          serviceProviderMappingId: z.string().uuid().optional(),
          minAmount: z.coerce.number().min(0).optional(),
          maxAmount: z.coerce.number().min(0).optional(),

          // 🔹 Others
          config: z.any().optional(),
          priority: z.number().optional(),
          isActive: z.boolean().optional(),
        })

        // =========================
        // 🔥 ADVANCED VALIDATION
        // =========================
        .superRefine((data, ctx) => {
          // =========================
          // TYPE BASED VALIDATION
          // =========================
          if (data.type === "mapping") {
            if (!data.serviceId) {
              ctx.addIssue({
                code: "custom",
                path: ["serviceId"],
                message: "serviceId is required for mapping",
              });
            }

            if (!data.providerId) {
              ctx.addIssue({
                code: "custom",
                path: ["providerId"],
                message: "providerId is required for mapping",
              });
            }

            if (!data.mode) {
              ctx.addIssue({
                code: "custom",
                path: ["mode"],
                message: "mode is required",
              });
            }

            // =========================
            // MODE RULES
            // =========================
            if (data.mode === "SURCHARGE" && data.sellingPrice) {
              ctx.addIssue({
                code: "custom",
                path: ["sellingPrice"],
                message: "Selling price not allowed in SURCHARGE mode",
              });
            }

            if (data.mode === "COMMISSION" && !data.sellingPrice) {
              ctx.addIssue({
                code: "custom",
                path: ["sellingPrice"],
                message: "Selling price required in COMMISSION mode",
              });
            }

            // =========================
            // SLAB RULE
            // =========================
            if (data.supportsSlab && (data.providerCost || data.sellingPrice)) {
              ctx.addIssue({
                code: "custom",
                path: ["supportsSlab"],
                message:
                  "Remove providerCost and sellingPrice when slab enabled",
              });
            }

            // =========================
            // GST VALIDATION
            // =========================
            if (data.applyGST) {
              if (!data.gstPercent || data.gstPercent <= 0) {
                ctx.addIssue({
                  code: "custom",
                  path: ["gstPercent"],
                  message: "GST percent required",
                });
              }

              if (data.mode === "COMMISSION") {
                ctx.addIssue({
                  code: "custom",
                  path: ["applyGST"],
                  message: "GST not allowed in COMMISSION mode",
                });
              }
            }

            // =========================
            // TDS VALIDATION
            // =========================
            if (data.applyTDS) {
              if (!data.tdsPercent || data.tdsPercent <= 0) {
                ctx.addIssue({
                  code: "custom",
                  path: ["tdsPercent"],
                  message: "TDS percent required",
                });
              }

              if (data.mode === "SURCHARGE") {
                ctx.addIssue({
                  code: "custom",
                  path: ["applyTDS"],
                  message: "TDS not allowed in SURCHARGE mode",
                });
              }
            }
          }

          // =========================
          // SLAB VALIDATION
          // =========================
          if (data.type === "slab") {
            if (!data.serviceProviderMappingId) {
              ctx.addIssue({
                code: "custom",
                path: ["serviceProviderMappingId"],
                message: "Mapping ID required",
              });
            }

            if (!data.minAmount || !data.maxAmount) {
              ctx.addIssue({
                code: "custom",
                path: ["minAmount"],
                message: "minAmount and maxAmount required",
              });
            }

            if (data.minAmount >= data.maxAmount) {
              ctx.addIssue({
                code: "custom",
                path: ["maxAmount"],
                message: "maxAmount must be greater than minAmount",
              });
            }
          }
        })
    );
  }
}
