import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { userService } from "./user.services";

// register PENDING  user
const createPendingUser = catchAsync(async (req, res) => {
  const result = await userService.createPendingUserIntoDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "Pending User created successfully",
    data: result,
  });
});

// resend OTP
const resendOTP = catchAsync(async (req, res) => {
  const result = await userService.resendVerifyOTP(req.body.email);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "OTP resend successfully",
    data: result,
  });
});

// match the OTP and register user
const createUser = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const result = await userService.createUserIntoDB(email, otp);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "User created successfully",
    data: result,
  });
});

//get users
const getUsers = catchAsync(async (req, res) => {
  const users = await userService.getUsers(req.query);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Users retrived successfully",
    data: users,
  });
});

//get single user
const getSingleUser = catchAsync(async (req, res) => {
  const user = await userService.getSingleUserIntoDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "user retrived successfully",
    data: user,
  });
});

//delete user
const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User deleted successfully",
  });
});

//update user
const updateUser = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File;
  await userService.updateUser(req.body, req.params.userId, file);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "User updated successfully",
  });
});

//delete user
const deleteMyAccount = catchAsync(async (req, res) => {
  const userId = req.user.id;
  await userService.deleteMyAccount(userId);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "My account deleted successfully",
  });
});


export const UserControllers = {
  createUser,
  createPendingUser,
  getUsers,
  getSingleUser,
  updateUser,
  deleteMyAccount,
  deleteUser,
  resendOTP,
};
