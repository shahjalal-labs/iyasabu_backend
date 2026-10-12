import catchAsync from "../../../shared/catchAsync";
import { authService } from "./auth.service";
import sendResponse from "../../../shared/sendResponse";
import ApiError from "../../../errors/ApiErrors";

const loginUser = catchAsync(async (req, res) => {
  const result = await authService.loginUserIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User successfully logged in",
    data: result,
  });
});

const adminLogin = catchAsync(async (req, res) => {
  const result = await authService.adminLogin(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin successfully logged in",
    data: result,
  });
});

const authLogin = catchAsync(async (req, res) => {
  const result = await authService.authLoginIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User successfully logged in",
    data: result,
  });
});

const sendForgotPasswordOtp = catchAsync(async (req, res) => {
  const email = req.body.email as string;
  const response = await authService.sendForgotPasswordOtpDB(email);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP send successfully",
    data: response,
  });
});

const verifyForgotPasswordOtpCode = catchAsync(async (req, res) => {
  const payload = req.body;
  const response = await authService.verifyForgotPasswordOtpCodeDB(payload);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "OTP verified successfully.",
    data: response,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const { newPassword } = req.body;
  const result = await authService.resetForgotPasswordDB(newPassword, userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password updated successfully.",
    data: result,
  });
});

const getProfile = catchAsync(async (req: any, res) => {
  const { id } = req.user;
  const user = await authService.getProfileFromDB(id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile retrieved successfully",
    data: user,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File;
  await authService.updateProfileIntoDB(req.body, req.user.id, file);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User profile update successfully",
  });
});

const changePassword = catchAsync(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Your password has been changed successfully",
  });
});

// ---------------------- Business profile controllers ------------------------//

const createNewBusinessProfile = catchAsync(async (req, res) => {
  const file = req.file as Express.Multer.File;
  if (!file) {
    throw new ApiError(400, "Please upload a file");
  }
  const result = await authService.createNewBusinessProfile(
    req.user.id,
    file,
    req.body
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "New Business Profile Added successfully",
    data: result,
  });
});
const updateBusinessProfile = catchAsync(async (req, res) => {
  const { businessProfileId } = req.params;
  const file = req.file as Express.Multer.File;
  const result = await authService.updateBusinessProfile(
    req.user.id,
    req.body,
    businessProfileId,
    file,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Business Profile updated successfully",
    data: result,
  });
});
const hasSubscription = catchAsync(async (req, res) => {
  const { businessProfileId } = req.params;
  const result = await authService.hasSubscription(businessProfileId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Business Profile subscription status retrieved successfully",
    data: result,
  });
});

export const authController = {
  loginUser,
  adminLogin,
  getProfile,
  updateProfile,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtpCode,
  resetPassword,
  authLogin,
  changePassword,
  createNewBusinessProfile,
  updateBusinessProfile,
  hasSubscription
};
