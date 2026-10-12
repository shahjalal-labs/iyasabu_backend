import * as z from "zod";

export const createShippingCostSchema = z.object({
  // Define fields
  cost: z.number({ required_error: "Cost is required" }),
});

export const ShippingCostSchemaValidation = {
  createShippingCostSchema,
};
