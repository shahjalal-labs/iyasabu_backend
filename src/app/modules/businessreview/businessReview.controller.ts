import { Request, Response } from "express";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";
import { businessReviewServices } from "./businessReview.service";
import ApiError from "../../../errors/ApiErrors";
import httpStatus from "http-status";

const createBusinessReview = catchAsync(async (req: Request, res: Response) => {
  const businessProfileId = req.params.businessProfileId;
  if (!businessProfileId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "businessProfileId is required");
  }
  const result = await businessReviewServices.createBusinessReview(
    req.body,
    businessProfileId
  );
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "The businessReview has been created successfully",
    data: result,
  });
});

const getAllBusinessReviews = catchAsync(
  async (_req: Request, res: Response) => {
    const businessOwnerProfileId = _req.params.businessProfileId;
    if (!businessOwnerProfileId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "businessProfileId is required"
      );
    }
    const result = await businessReviewServices.getAllBusinessReviews(
      _req.query,
      businessOwnerProfileId,
      _req.user
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "All businessReviews has been retrived successfully",
      data: result,
    });
  }
);
const getAllBusinessReviewsForAdmin = catchAsync(
  async (_req: Request, res: Response) => {
    const result = await businessReviewServices.getAllBusinessReviewsForAdmin(
      _req.query
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "All businessReviews for admin has been retrived successfully",
      data: result,
    });
  }
);

const getBusinessDashboardOverview = catchAsync(
  async (_req: Request, res: Response) => {
    const businessOwnerProfileId = _req.params.businessProfileId;
    if (!businessOwnerProfileId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "businessProfileId is required"
      );
    }
    const result = await businessReviewServices.getBusinessDashboardOverview(
      businessOwnerProfileId,
      _req.user
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "overview data has been retrived successfully",
      data: result,
    });
  }
);
const getBusinessDashboardOverviewChart = catchAsync(
  async (_req: Request, res: Response) => {
    const businessOwnerProfileId = _req.params.businessProfileId;
    if (!businessOwnerProfileId) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "businessProfileId is required"
      );
    }
    const { type } = _req.query;
    const overviewType = (type as string) || "daily";
    const result =
      await businessReviewServices.getBusinessDashboardOverviewChart(
        overviewType as "daily" | "weekly" | "monthly" | "yearly",
        businessOwnerProfileId,
        _req.user
      );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "overview chart data has been retrived successfully",
      data: result,
    });
  }
);

const getBusinessReviewById = catchAsync(
  async (req: Request, res: Response) => {
    const result = await businessReviewServices.getBusinessReviewById(
      req.params.id
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "businessReview has been retrived successfully",
      data: result,
    });
  }
);
const calculateScanningCount = catchAsync(
  async (req: Request, res: Response) => {
    await businessReviewServices.calculateScanningCount(
      req.params.businessProfileId
    );
    sendResponse(res, {
      success: true,
      statusCode: 200,
      message: "businessReview has been retrived successfully",
    });
  }
);

const updateBusinessReview = catchAsync(async (req: Request, res: Response) => {
  const result = await businessReviewServices.updateBusinessReview(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "businessReview has been updated successfully",
    data: result,
  });
});

const deleteBusinessReview = catchAsync(async (req: Request, res: Response) => {
  await businessReviewServices.deleteBusinessReview(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "businessReview has been deleted successfully",
  });
});

export const businessReviewControllers = {
  createBusinessReview,
  getAllBusinessReviews,
  getBusinessReviewById,
  updateBusinessReview,
  deleteBusinessReview,
  calculateScanningCount,
  getBusinessDashboardOverview,
  getBusinessDashboardOverviewChart,
  getAllBusinessReviewsForAdmin,
};
