import * as z from "zod";

export const createShippingAddressSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email format"),
  phone: z.string(),
  address1: z.string().min(5, "Address line 1 is required"),
  businessName : z.string().optional(),
  address2: z.string().optional(), // ✅ Optional secondary address
  city: z.string().min(2, "City is required"),
  appartMent: z.string().optional(), // ✅ Optional apartment number
  zipcode: z.string().min(3, "Zip code is required"),
});

export const ShippingAddressSchemaValidation = {
  createShippingAddressSchema,
};
