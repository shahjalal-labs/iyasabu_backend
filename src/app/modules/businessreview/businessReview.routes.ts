import express from "express";
import { businessReviewControllers } from "./businessReview.controller";
import validateRequest from "../../middlewares/validateRequest";
import { createBusinessReviewSchema } from "./businessReview.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";
import { couponViewPageHtml } from ".";

const router = express.Router();

router.post(
  "/:businessProfileId",
  validateRequest(createBusinessReviewSchema),
  businessReviewControllers.createBusinessReview
);
router.post(
  "/scanningCount/:businessProfileId",
  businessReviewControllers.calculateScanningCount
);
router.get(
  "/:businessProfileId",
  auth(UserRole.User),
  businessReviewControllers.getAllBusinessReviews
);
router.get(
  "/",
  auth(UserRole.Admin),
  businessReviewControllers.getAllBusinessReviewsForAdmin
);
router.get("/offer/view-coupon", couponViewPageHtml);
router.get(
  "/:id",
  auth(UserRole.User),
  businessReviewControllers.getBusinessReviewById
);
router.patch(
  "/:id",
  auth(UserRole.User),
  businessReviewControllers.updateBusinessReview
);
router.delete(
  "/:id",
  auth(UserRole.User),
  businessReviewControllers.deleteBusinessReview
);

router.get("/owner-dashboard-overview/:businessProfileId", auth(), businessReviewControllers.getBusinessDashboardOverview);
router.get("/owner-dashboard-overview-chart/:businessProfileId", auth(), businessReviewControllers.getBusinessDashboardOverviewChart);

export const businessReviewRoutes = router;
