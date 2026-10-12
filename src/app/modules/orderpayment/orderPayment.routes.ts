import express from "express";
import { orderPaymentControllers } from "./orderPayment.controller";
import auth from "../../middlewares/auth";
import validateRequest from "../../middlewares/validateRequest";
import { OrderPaymentSchemaValidation } from "./orderPayment.validation";
import { UserRole } from "@prisma/client";
import { productControllers } from "../product/product.controller";

const router = express.Router();

// router.post(
//   "/cashOnDelivary",
//   auth(),
//   validateRequest(OrderPaymentSchemaValidation.createOrderPaymentSchema),
//   orderPaymentControllers.createOrderWithOutPayment
// );
router.post(
  "/order-payment",
  auth(),
  validateRequest(OrderPaymentSchemaValidation.orderWithPaymentSchema),
  orderPaymentControllers.createOrderWithPayment
);
router.post(
  "/cancel-order",
  auth(),
  validateRequest(OrderPaymentSchemaValidation.cancelOrder),
  orderPaymentControllers.cancelOrder
);
// router.post(
//   "/calculate-discount",
//   auth(),
//   validateRequest(OrderPaymentSchemaValidation.calculateDiscountPaymentSchema),
//   orderPaymentControllers.calculateDiscount
// );
router.get(
  "/",
  auth(UserRole.Admin),
  orderPaymentControllers.getAllOrderPayments
);
router.get(
  "/my-orders",
  auth(),
  orderPaymentControllers.getMyOrderFromDB
);
router.get(
  "/payment-history",
  auth(UserRole.Admin),
  orderPaymentControllers.getPaymentHistory
);
router.get(
  "/admin-overview",
  auth(UserRole.Admin),
  orderPaymentControllers.adminOverViewData
);
router.get(
  "/admin-overview/orders",
  auth(UserRole.Admin),
  orderPaymentControllers.getUserDataForAdminOverView
);
router.get("/:id", orderPaymentControllers.getOrderPaymentById);
router.patch("/:id", orderPaymentControllers.updateOrderPayment);
router.delete("/:id", orderPaymentControllers.deleteOrderPayment);

export const orderPaymentRoutes = router;
