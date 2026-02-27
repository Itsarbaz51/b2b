import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/AsyncHandler.js";
import Prisma from "../db/db.js";

export const ROLE_TYPES = {
  BUSINESS: "business",
  EMPLOYEE: "employee",
};

// Predefined business roles (jo system mein fixed hain)
const PREDEFINED_BUSINESS_ROLES = [
  "ADMIN",
  "STATE HEAD",
  "MASTER DISTRIBUTOR",
  "DISTRIBUTOR",
  "RETAILER",
];

class AuthMiddleware {
  static isAuthenticated = asyncHandler(async (req, res, next) => {
    const token =
      req.cookies?.accessToken ||
      req.headers["authorization"]?.replace("Bearer ", "");

    if (!token) {
      throw ApiError.unauthorized("Unauthorized: No token provided");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
      throw ApiError.unauthorized("Unauthorized: Invalid/Expired token");
    }

    const userExists = await Prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        role: {
          select: {
            name: true,
            type: true,
            level: true,
          },
        },
      },
    });

    if (!userExists) {
      throw ApiError.unauthorized("Unauthorized: Invalid token user");
    }

    req.user = {
      id: userExists.id,
      email: userExists.email,
      role: userExists.role.name,
      roleType: userExists.role.type,
      roleLevel: userExists.role.level,
      roleDetails: userExists.role,
    };

    return next();
  });

  // Unified authorization middleware
  static authorize = (allowedAccess = []) => {
    // Validate input array
    if (!Array.isArray(allowedAccess)) {
      throw new Error("Authorization rules must be an array");
    }

    // Check for duplicates and validate entries
    const seen = new Set();
    const validRoleTypes = Object.values(ROLE_TYPES);

    for (const item of allowedAccess) {
      if (seen.has(item)) {
        throw new Error(
          `Duplicate entry found in authorization rules: ${item}`
        );
      }
      seen.add(item);

      // Validate if item is either a predefined business role or a valid role type
      if (
        !PREDEFINED_BUSINESS_ROLES.includes(item) &&
        !validRoleTypes.includes(item)
      ) {
        throw new Error(
          `Invalid authorization entry: ${item}. Must be either a predefined business role or valid role type.`
        );
      }
    }

    return asyncHandler(async (req, res, next) => {
      const userRole = req.user?.role;
      const userRoleType = req.user?.roleType;

      if (!userRole || !userRoleType) {
        throw ApiError.forbidden(
          "Access denied: User role information missing"
        );
      }

      // Check if user has access based on either role name or role type
      const hasAccess = allowedAccess.some((accessItem) => {
        // If accessItem is a role type, check against user's role type
        if (Object.values(ROLE_TYPES).includes(accessItem)) {
          return userRoleType === accessItem;
        }
        // If accessItem is a role name, check against user's role name
        else {
          return userRole === accessItem;
        }
      });

      if (!hasAccess) {
        const formattedAccess = allowedAccess.map((item) =>
          Object.values(ROLE_TYPES).includes(item)
            ? `${item} (role type)`
            : item
        );

        throw ApiError.forbidden(
          `Access denied. Required: ${formattedAccess.join(", ")}. Your role: ${userRole} (${userRoleType})`
        );
      }

      return next();
    });
  };

  // Backward compatibility ke liye existing methods
  static authorizeBusinessRoles = (allowedRoles = []) =>
    this.authorize(allowedRoles);

  static authorizeEmployeeRoles = (allowedRoles = []) =>
    this.authorize([...allowedRoles, ROLE_TYPES.EMPLOYEE]);

  static authorizeRoleTypes = (allowedRoleTypes = []) =>
    this.authorize(allowedRoleTypes);
}

export default AuthMiddleware;
