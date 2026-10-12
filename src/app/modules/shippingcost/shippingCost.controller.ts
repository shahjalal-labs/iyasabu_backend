import { Request, Response } from 'express';
import {shippingCostServices} from './shippingCost.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from "../../../shared/catchAsync";
 
const createShippingCost = catchAsync (async (req: Request, res: Response) => {
  const result = await shippingCostServices.createShippingCost(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The shippingCost has been created successfully",
    data: result,
  });
})
 
const getAllShippingCosts = catchAsync(async (_req: Request, res: Response) => {
  const result = await shippingCostServices.getAllShippingCosts();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All shippingCosts has been retrived successfully",
    data: result,
  });
})
 
// const getShippingCostById = catchAsync(async (req: Request, res: Response) => {
//   const result = await shippingCostServices.getShippingCostById(req.params.id);
//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: "shippingCost has been retrived successfully",
//     data: result,
//   });
// })
 
// const updateShippingCost = catchAsync(async (req: Request, res: Response) => {
//   const result = await shippingCostServices.updateShippingCost(req.params.id, req.body);
//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: "shippingCost has been updated successfully",
//     data: result,
//   });
// })
 
// const deleteShippingCost = catchAsync(async (req: Request, res: Response) => {
//   await shippingCostServices.deleteShippingCost(req.params.id);
//   sendResponse(res, {
//     success: true,
//     statusCode: 200,
//     message: "shippingCost has been deleted successfully",
//   });
// })
 
export const shippingCostControllers = {
  createShippingCost,
  getAllShippingCosts,
  // getShippingCostById,
  // updateShippingCost,
  // deleteShippingCost,
}
  