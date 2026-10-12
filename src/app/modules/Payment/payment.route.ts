import express from 'express';
import auth from '../../middlewares/auth';
import { paymentControllers } from './payment.controller';
import validateRequest from '../../middlewares/validateRequest';
import { paymentValidation } from './payment.validation';
import { UserRole } from '@prisma/client';

const router = express.Router();

// -----------/ START THE PRODUCT /-------------//

router.post(
  '/create/stripe-plan',
  auth(UserRole.Admin),
  paymentControllers.createPlan,
);
router.get('/stripe-plans', paymentControllers.getAllPlans);
router.get('/active-plans', paymentControllers.getActivePlans);
router.get('/stripe-plan/:planId', paymentControllers.singlePlan);
router.patch(
  '/update-plan/:planId',
  auth(UserRole.Admin),
  paymentControllers.editPlanInStripe,
);
// -----------/ END THE PRODUCT /-------------//

// GET THE EARNING
router.get(
  '/total-earnings',
  auth(UserRole.Admin),
  paymentControllers.totalEarnings,
);

// -----------/ START THE PAYMENT /-------------//
router.post(
  '/create/stripe-subscription',
  auth(),
  validateRequest(paymentValidation),
  paymentControllers.createSubcription,
);

router.patch(
  '/update/stripe-subscription',
  auth(),
  paymentControllers.updateSubscription,
);

router.delete(
  '/cancel/stripe-subscription',
  auth(),
  paymentControllers.cancelSubscription,
);

router.get(
  '/payments',
  auth(UserRole.Admin),
  paymentControllers.allPayments,
);
router.get(
  '/payments/:paymentId',
  auth(UserRole.Admin),
  paymentControllers.getPaymentDetails,
);

export const paymentRoute = router;
