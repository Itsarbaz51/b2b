import { z } from "zod";

class BeneficiaryValidationSchemas {
  static get list() {
    return z.object({
      mobile: z.string().regex(/^\d{10}$/, "Mobile must be 10 digits"),
    });
  }
}

export default BeneficiaryValidationSchemas;
