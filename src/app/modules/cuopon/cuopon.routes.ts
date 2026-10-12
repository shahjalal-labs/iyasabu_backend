import express from "express";
import { cuoponControllers } from "./cuopon.controller";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import validateRequest from "../../middlewares/validateRequest";
import { createCouponSchema, sendCuoponSchema } from "./cuopon.validation";

const router = express.Router();

router.post(
  "/:businessProfileId",
  auth(UserRole.User),
  validateRequest(createCouponSchema),
  cuoponControllers.createCuopon
);
router.get("/", auth(UserRole.User), cuoponControllers.getAllCuopons);
router.post(
  "/send-user/coupon",
  auth(UserRole.User),
  validateRequest(sendCuoponSchema),
  cuoponControllers.sendCuoponToUser
);
router.get("/:id", auth(UserRole.User), cuoponControllers.getCuoponById);
router.patch("/:id", auth(UserRole.User), cuoponControllers.updateCuopon);
router.delete("/:id", auth(UserRole.User), cuoponControllers.deleteCuopon);

export const cuoponRoutes = router;
