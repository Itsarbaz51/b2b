import { z } from "zod";

const ListCategories = z.object({
  serviceProviderMappingId: z.string().uuid(),
});

const SelectBiller = z.object({
  serviceProviderMappingId: z.string().uuid(),

  biller: z.string().min(2, "Biller is required").max(100, "Invalid biller"),
});

const FetchBill = z.object({
  serviceProviderMappingId: z.string().uuid(),

  billerId: z.string().min(2, "BillerId is required"),

  reference: z
    .string()
    .min(3, "Reference required")
    .max(50, "Reference too long"),

  custParam: z
    .array(
      z.object({
        name: z.string().min(1, "Param name required"),
        value: z.string().min(1, "Param value required"),
      })
    )
    .min(1, "At least one customer parameter required"),
});

const PayBill = z.object({
  serviceProviderMappingId: z.string().uuid(),

  fetchId: z.string().min(3, "Invalid fetchId"),

  amount: z.coerce.number().min(1, "Amount must be greater than 0"),

  reference: z
    .string()
    .min(3, "Reference required")
    .max(50, "Reference too long"),
});

const CheckStatus = z.object({
  serviceProviderMappingId: z.string().uuid(),

  transactionId: z.string().min(3, "Invalid transactionId"),
});

const ListTransactions = z.object({
  serviceProviderMappingId: z.string().uuid(),

  page: z.coerce.number().min(1).optional(),
  limit: z.coerce.number().min(1).max(50).optional(),

  category: z.string().optional(),

  status: z.enum(["SUCCESS", "FAILED", "PENDING"]).optional(),
});

const PendingBills = z.object({
  serviceProviderMappingId: z.string().uuid(),

  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),

  billerCategory: z.string().optional(),

  isAutofetchEnabled: z.enum(["1", "2"]).optional(),

  sort: z.enum(["dueDate", "createdAt"]).optional(),

  order: z.enum(["asc", "desc"]).optional(),
});

export const BbpsValidationSchemas = {
  ListCategories,
  SelectBiller,
  FetchBill,
  PayBill,
  CheckStatus,
  ListTransactions,
  PendingBills,
};
