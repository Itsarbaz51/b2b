import { z } from "zod";

class AddressValidationSchemas {
  static get Address() {
    return z.object({
      address: z
        .string()
        .min(5, "Address must be at least 5 characters long.")
        .max(500, "Address must be at most 500 characters long."),
      pinCode: z
        .string()
        .length(6, "Pin code must be exactly 6 digits.")
        .regex(/^[0-9]{6}$/, "Pin code must contain only numeric digits."),
      stateId: z.string().uuid("State ID must be a valid UUID."),
      cityId: z.string().uuid("City ID must be a valid UUID."),
    });
  }

  static get State() {
    return z.object({
      stateName: z
        .string()
        .min(2, "State name must be at least 2 characters long.")
        .max(100, "State name must be at most 100 characters long."),
    });
  }

  static get City() {
    return z.object({
      cityName: z
        .string()
        .min(2, "City name must be at least 2 characters long.")
        .max(100, "City name must be at most 100 characters long."),
    });
  }
}

export default AddressValidationSchemas;