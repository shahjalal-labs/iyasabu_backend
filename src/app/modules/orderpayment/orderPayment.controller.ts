import { Request, Response } from "express";
import { orderPaymentServices } from "./orderPayment.service";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";

const createOrderWithPayment = catchAsync(
  async (req: Request, res: Response) => {
    const result = await orderPaymentServices.createOrderWithPayment(
      req.body,
      req.user
    );
    sendResponse(res, {
      success: true,
      statusCode: 201,
      message: "Your order  has been created successfully with payment .",
      data: result,
    });
  }
);
const cancelOrder = catchAsync(async (req: Request, res: Response) => {
  const result = await orderPaymentServices.cancelOrder(req.body, req.user);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Your order  has been cancenlled successfully .",
    data: result,
  });
});
// const calculateDiscount = catchAsync(async (req: Request, res: Response) => {
//   const result = await orderPaymentServices.calculateDiscount(
//     req.body,
//     req.user.id
//   );
//   sendResponse(res, {
//     success: result.success,
//     statusCode: result.statusCode,
//     message: result.message,
//     data: {
//       subtotal: result.subtotal,
//       discount: result.discount,
//       afterDiscountAmount: result.afterDiscountAmount,
//       shippingCost: result.shippingCost,
//       total: result.total,
//     },
//   });
// });

const getAllOrderPayments = catchAsync(async (_req: Request, res: Response) => {
  const result = await orderPaymentServices.getAllOrderPayments(_req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All orderPayments has been retrived successfully",
    data: result,
  });
});

const getMyOrderFromDB = catchAsync(async (_req: Request, res: Response) => {
  const result = await orderPaymentServices.getMyOrderFromDB(
    _req.query,
    _req.user.id
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "My order has been retrived successfully",
    data: result,
  });
});

const getPaymentHistory = catchAsync(async (_req: Request, res: Response) => {
  const result = await orderPaymentServices.getPaymentHistory(_req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All payment history has been retrived successfully",
    data: result,
  });
});
const adminOverViewData = catchAsync(async (_req: Request, res: Response) => {
  const result = await orderPaymentServices.adminOverViewData();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "admin overview data has been retrived successfully",
    data: result,
  });
});
const getUserDataForAdminOverView = catchAsync(async (_req: Request, res: Response) => {
  const { type } = _req.query;
  const overviewType = (type as string) || "daily"; // default to "daily" if not provided
  const result = await orderPaymentServices.getUserDataForAdminOverView(overviewType as "daily" | "weekly" | "monthly" | "yearly");
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "admin overview chart has been retrived successfully",
    data: result,
  });
});

const getOrderPaymentById = catchAsync(async (req: Request, res: Response) => {
  const result = await orderPaymentServices.getOrderPaymentById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "orderPayment has been retrived successfully",
    data: result,
  });
});

const updateOrderPayment = catchAsync(async (req: Request, res: Response) => {
  const result = await orderPaymentServices.updateOrderPayment(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "orderPayment has been updated successfully",
    data: result,
  });
});

const deleteOrderPayment = catchAsync(async (req: Request, res: Response) => {
  await orderPaymentServices.deleteOrderPayment(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "orderPayment has been deleted successfully",
  });
});

export const orderPaymentControllers = {
  getAllOrderPayments,
  getOrderPaymentById,
  updateOrderPayment,
  deleteOrderPayment,
  createOrderWithPayment,
  cancelOrder,
  getPaymentHistory,
  // calculateDiscount,
  getMyOrderFromDB,
  adminOverViewData,
  getUserDataForAdminOverView
};
