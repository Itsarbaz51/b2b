import { Router } from "express";
import AuthMiddleware from "../middlewares/auth.middleware.js";
import UserController from "../controllers/user.controller.js";
import { validateRequest } from "../middlewares/validateRequest.js";
import upload from "../middlewares/multer.middleware.js";
import UserValidationSchemas from "../validations/userValidation.schemas.js";

const userRoutes = Router();

//  GET CURRENT BUSINESS USER
userRoutes.get(
  "/me",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorizeRoleTypes(["business", "employee"]),
  UserController.getCurrentUser
);

//  GET BUSINESS USERS BY ROLE
userRoutes.get(
  "/role/:roleId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "employee",
  ]),
  UserController.getAllUsersByRole
);

//  GET BUSINESS USERS BY CHILDREN ID
userRoutes.get(
  "/children/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "employee",
  ]),
  UserController.getAllUsersByChildrenId
);

//  GET BUSINESS USERS COUNT BY PARENT ID
userRoutes.get(
  "/count/parent/:parentId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "employee",
  ]),
  UserController.getAllUsersCountByParentId
);

//  GET BUSINESS USERS COUNT BY CHILDREN ID
userRoutes.get(
  "/count/children/:userId",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "employee",
  ]),
  UserController.getAllUsersCountByChildrenId
);

//  GET BUSINESS USER BY ID
userRoutes.get(
  "/:id",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "employee",
  ]),
  UserController.getUserById
);

//  REGISTER BUSINESS USER
userRoutes.post(
  "/register",
  upload.single("profileImage"),
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "employee",
  ]),
  validateRequest(UserValidationSchemas.register),
  UserController.register
);

//  UPDATE BUSINESS USER PROFILE
userRoutes.put(
  "/:userId/profile",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "employee",
  ]),
  validateRequest(UserValidationSchemas.updateProfile),
  UserController.updateProfile
);

//  UPDATE BUSINESS USER PROFILE IMAGE
userRoutes.put(
  "/:userId/profile-image",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "employee",
  ]),
  upload.single("profileImage"),
  validateRequest(UserValidationSchemas.updateProfileImage),
  UserController.updateProfileImage
);

//  GET ALL BUSINESS USERS BY PARENT ID
userRoutes.get(
  "/",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize([
    "ADMIN",
    "STATE HEAD",
    "MASTER DISTRIBUTOR",
    "DISTRIBUTOR",
    "employee",
  ]),
  UserController.getAllRoleTypeUsersByParentId
);

//  DEACTIVATE BUSINESS USER
userRoutes.patch(
  "/:userId/deactivate",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "employee"]),
  validateRequest(UserValidationSchemas.deactivateUser),
  UserController.deactivateUser
);

//  REACTIVATE BUSINESS USER
userRoutes.patch(
  "/:userId/reactivate",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "employee"]),
  validateRequest(UserValidationSchemas.reactivateUser),
  UserController.reactivateUser
);

//  DELETE BUSINESS USER
userRoutes.delete(
  "/:userId/delete",
  AuthMiddleware.isAuthenticated,
  AuthMiddleware.authorize(["ADMIN", "employee"]),
  validateRequest(UserValidationSchemas.deleteUser),
  UserController.deleteUser
);

export default userRoutes;
