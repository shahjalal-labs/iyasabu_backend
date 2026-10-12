import * as z from "zod";

export const createCouponSchema = z.object({
  title: z
    .string({ required_error: "Coupon title is required" })
    .min(3, "Title must be at least 3 characters long"),

  description: z
    .string({ required_error: "Description is required" })
    .min(5, "Description must be at least 5 characters long"),

  code: z
    .string({ required_error: "Coupon code is required" })
    .toUpperCase()
    .min(3, "Code must be at least 3 characters long"),

  discountType: z.enum(["Percentage", "Flat"], {
    required_error: "Discount type is required",
  }),

  discountValue: z
    .number({ required_error: "Please provide discount value" })
    .positive("Discount value must be greater than 0"),

  startDate: z.string({
    required_error: "Start date is required",
  }),

  endDate: z.string({
    required_error: "End date is required",
  }),

  expiresTime: z.number({
    required_error: "Expires time is required",
  }),
});

export const sendCuoponSchema = z.object({
  title: z.string({
    required_error: "title is must be required!",
  }),
  cuoponId: z.string({
    required_error: "cuopon is must be required!",
  }),
  emails: z
    .string({
      required_error: "please share emails list !",
    })
    .array(),
  description: z.string({
    required_error: "please share the description !",
  }),
});
