import * as z from "zod";
// Single order product schema
const orderProductSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
});
// Main order schema
export const orderSchema = z.object({
  products: z.array(orderProductSchema),
  status: z.enum(["Pending", "Processing", "Shipped", "Delivered"]).optional(),
  shippingAddressId: z.string({
    required_error: "Shipping address is required",
  }),
});
export const orderWithPaymentSchema = z.object({
  products: z.array(orderProductSchema),
  status: z.enum(["Pending", "Processing", "Shipped", "Delivered"]).optional(),
  shippingAddressId: z.string({
    required_error: "Shipping address is required",
  }),
  paymentMethodId: z.string({ required_error: "Payment method is required" }),
  businessProfileId: z.string({ required_error: "Business profile is required" }),
});
export const calculateDiscountPaymentSchema = z.object({
  products: z.array(orderProductSchema),
  couponCode: z.string({ required_error: "Coupon code is required" }),
});

export const cancelOrder = z.object({
  orderId: z.string({ required_error: "Order ID is Required " }),
  cancelReason: z.string({ required_error: "Cancel Reason is Required " }),

});

export const OrderPaymentSchemaValidation = {
  createOrderPaymentSchema: orderSchema,
  orderProductOrder: orderProductSchema,
  orderWithPaymentSchema,
  cancelOrder,
  calculateDiscountPaymentSchema
};
