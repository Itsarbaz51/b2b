import { Router } from "express";
import CCPayoutController from "../../controllers/bulkpay/ccPayout.controller.js";
import AuthMiddleware from "../../middlewares/auth.middleware.js";
import CCPayoutValidationSchemas from "../../validations/bulkpay/ccPayoutValidation.schemas.js";
import { validateRequest } from "../../middlewares/validateRequest.js";
import upload from "../../middlewares/multer.middleware.js";

const router = Router();
const payoutController = new CCPayoutController();

// Apply auth middleware to all routes except webhook
router.use(AuthMiddleware.isAuthenticated);

// Sender routes (Business users only)
router.post(
  "/createSender",
  AuthMiddleware.authorizeRoleTypes(["business"]),
  validateRequest(CCPayoutValidationSchemas.CreateSender),
  payoutController.createSender
);

router.post(
  "/uploadCreditcard",
  AuthMiddleware.authorizeRoleTypes(["business"]),
  validateRequest(CCPayoutValidationSchemas.UploadCardImage),
  upload.single("file"),
  payoutController.uploadCardImage
);

router.post(
  "/listSenders",
  AuthMiddleware.authorizeRoleTypes(["business"]),
  validateRequest(CCPayoutValidationSchemas.ListSenders),
  payoutController.listSenders
);

// Beneficiary routes (Business users only)
router.post(
  "/createBeneficiary",
  AuthMiddleware.authorizeRoleTypes(["business"]),
  validateRequest(CCPayoutValidationSchemas.CreateBeneficiary),
  payoutController.createBeneficiary
);

router.post(
  "/listBeneficiary",
  AuthMiddleware.authorizeRoleTypes(["business"]),
  validateRequest(CCPayoutValidationSchemas.ListBeneficiaries),
  payoutController.listBeneficiaries
);

// Collection routes (Business users only)
router.post(
  "/createCardCollectionUrl",
  AuthMiddleware.authorizeRoleTypes(["business"]),
  validateRequest(CCPayoutValidationSchemas.CreateCollection),
  payoutController.createCollection
);

router.post(
  "/listCardCollection",
  AuthMiddleware.authorizeRoleTypes(["business"]),
  validateRequest(CCPayoutValidationSchemas.ListCollections),
  payoutController.listCollections
);

// Dashboard (Business users only)
router.get(
  "/dashboard",
  AuthMiddleware.authorizeRoleTypes(["business"]),
  payoutController.getDashboard
);

// Webhook (no auth required - external service calls)
router.post(
  "/webhook",
  validateRequest(CCPayoutValidationSchemas.Webhook),
  payoutController.webhookHandler
);

export default router;
