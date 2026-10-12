import express from 'express';
import { shippingCostControllers } from "./shippingCost.controller";
import auth from '../../middlewares/auth';
import { UserRole } from '@prisma/client';
 
const router = express.Router();
 
router.post('/',auth(UserRole.Admin), shippingCostControllers.createShippingCost);
router.get('/', shippingCostControllers.getAllShippingCosts);
// router.get('/:id', shippingCostControllers.getShippingCostById);
// router.patch('/:id', shippingCostControllers.updateShippingCost);
// router.delete('/:id', shippingCostControllers.deleteShippingCost);
 
export const shippingCostRoutes = router;
  