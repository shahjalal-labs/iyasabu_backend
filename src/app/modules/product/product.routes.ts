import express from "express";
import { productControllers } from "./product.controller";
import { fileUploader } from "../../../helpers/fileUploadHelper";
import { parseBodyData } from "../../middlewares/parseBodyData";
import validateRequest from "../../middlewares/validateRequest";
import { ProductSchemaValidation } from "./product.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();
router.post(
  "/",
  auth(UserRole.Admin),
  fileUploader.uploadMultiple,
  parseBodyData,
  validateRequest(ProductSchemaValidation.createProductSchema),
  productControllers.createProduct
);
router.get("/", productControllers.getAllProducts);
router.get("/:id", productControllers.getProductById);
router.patch(
  "/:id",
  auth(UserRole.Admin),
  fileUploader.uploadMultiple,
  parseBodyData,
  productControllers.updateProduct
);
router.delete("/:id", auth(UserRole.Admin), productControllers.deleteProduct);

export const productRoutes = router;
