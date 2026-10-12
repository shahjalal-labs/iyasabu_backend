import { Request, Response } from 'express';
import {cuoponServices} from './cuopon.service';
import sendResponse from '../../../shared/sendResponse';
import catchAsync from "../../../shared/catchAsync";
 
const createCuopon = catchAsync (async (req: Request, res: Response) => {
  const businessProfileId = req.params.businessProfileId;
  if(!businessProfileId){
    throw new Error("businessProfileId is required");
  }
  const result = await cuoponServices.createCuopon(req.body , req.user , businessProfileId);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The cuopon has been created successfully",
    data: result,
  });
})
const sendCuoponToUser = catchAsync (async (req: Request, res: Response) => {
  const result = await cuoponServices.sendCuoponToUser(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The cuopon has been send successfully",
    data: result,
  });
})
 
const getAllCuopons = catchAsync(async (_req: Request, res: Response) => {
  const result = await cuoponServices.getAllCuopons(_req.query ,_req.user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "All cuopons has been retrived successfully",
    data: result,
  });
})
 
const getCuoponById = catchAsync(async (req: Request, res: Response) => {
  const result = await cuoponServices.getCuoponById(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "cuopon has been retrived successfully",
    data: result,
  });
})
 
const updateCuopon = catchAsync(async (req: Request, res: Response) => {
  const result = await cuoponServices.updateCuopon(req.params.id, req.body , req.user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "cuopon has been updated successfully",
    data: result,
  });
})
 
const deleteCuopon = catchAsync(async (req: Request, res: Response ,) => {
  await cuoponServices.deleteCuopon(req.params.id , req.user);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "cuopon has been deleted successfully",
  });
})
 
export const cuoponControllers = {
  createCuopon,
  getAllCuopons,
  getCuoponById,
  updateCuopon,
  deleteCuopon,
  sendCuoponToUser
}
  