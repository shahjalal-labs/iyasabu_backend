
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { paymentServices } from './payment.service';

const createPlan = catchAsync(async (req, res) => {
  const result = await paymentServices.createPlanInStripe(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Plan created successfully',
    data: result,
  });
});

const getAllPlans = catchAsync(async (req, res) => {
  const result = await paymentServices.allPlansFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'All plans fetched successfully',
    data: result,
  });
});

const getActivePlans = catchAsync(async (req, res) => {
  const result = await paymentServices.activePlansFromDB();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Active plans fetched successfully',
    data: result,
  });
});

const singlePlan = catchAsync(async (req, res) => {
  const { planId } = req.params;
  const result = await paymentServices.getPlanFromDB(planId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Plan fetched successfully',
    data: result,
  });
});

const editPlanInStripe = catchAsync(async (req, res) => {
  const { planId } = req.params;
  const result = await paymentServices.editPlanInStripe(req.body, planId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Plan updated successfully',
    data: result,
  });
});

const totalEarnings = catchAsync(async (req, res) => {
  const result = await paymentServices.totalEarningsFromStripe();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Total earnings fetched successfully',
    data: result,
  });
});

const createSubcription = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await paymentServices.createSubscriptionInStripe(
    userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment successfull',
    data: result,
  });
});

const cancelSubscription = catchAsync(async (req, res) => {
  const userId = req.user.id;
  await paymentServices.cancelSubscriptionInDB(req.body, userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription cancel successfull',
  });
});

const updateSubscription = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const result = await paymentServices.updateSubscriptionInStripe(
    req.body,
    userId,
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Subscription update successfull',
    data: result,
  });
});

const handelPaymentWebhook = catchAsync(async (req, res) => {
  const result = await paymentServices.handelPaymentWebhook(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "webhooks successfully worked ",
    data: result,
  });
});

const allPayments = catchAsync(async (req, res) => {
  const result = await paymentServices.getPaymentsFromDB(req);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payments fetched successfully',
    data: result,
  });
});

const getPaymentDetails = catchAsync(async (req, res) => {
  const { paymentId } = req.params;
  const result = await paymentServices.getPaymentDetailsFromDB(paymentId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Payment details fetched successfully',
    data: result,
  });
});

export const paymentControllers = {
  createPlan,
  getAllPlans,
  getActivePlans,
  singlePlan,
  editPlanInStripe,
  totalEarnings,
  createSubcription,
  handelPaymentWebhook,
  updateSubscription,
  cancelSubscription,
  allPayments,
  getPaymentDetails,
};
