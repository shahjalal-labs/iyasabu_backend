import express from "express";
import { authController } from "./auth.controller";
import auth from "../../middlewares/auth";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { businessOwnerProfile, businessOwnerProfileUpdate } from "./auth.validation";

const router = express.Router();

router.post("/login", authController.loginUser);
router.post("/admin-login", authController.adminLogin);
router.post("/social/login", authController.authLogin);
router.get("/profile", auth(), authController.getProfile);
router.post("/send-otp", authController.sendForgotPasswordOtp);
router.post("/verify-otp", authController.verifyForgotPasswordOtpCode);
router.patch("/reset-password", auth(), authController.resetPassword);
router.put(
  "/set-profile",
  auth(),
  fileUploader.profileImage,
  parseBodyData,
  authController.updateProfile
);
router.patch("/change-password", auth(), authController.changePassword);


///---------------------- business owners profile --------- ----------------

//! need to add subscribe functionality
router.patch(
  "/business-owner/create-profile",
  auth(UserRole.User),
  fileUploader.uploadSingle,
  parseBodyData,
  validateRequest(businessOwnerProfile),
  authController.createNewBusinessProfile
);
router.patch(
  "/business-owner/update-profile/:businessProfileId",
  auth(UserRole.User),
  fileUploader.uploadSingle,
  parseBodyData,
  validateRequest(businessOwnerProfileUpdate),
  authController.updateBusinessProfile
);
router.get("/has-subscribe/:businessProfileId", authController.hasSubscription);

export const authRoute = router;
