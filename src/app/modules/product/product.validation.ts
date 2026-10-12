import * as z from 'zod';


// Product Schema
export const createProductSchema = z.object({
  title: z.string().min(1, "Product name is required"),
  description: z.string(),
  price: z.number().nonnegative("Price must be positive"),
  oldPrice: z.number().nonnegative("old Price must be positive"),
  quantity: z.number().int().nonnegative().optional(),
  rating : z.number().optional()
});
export const ProductSchemaValidation = {
createProductSchema,
};
