import asyncHandler from "../utils/AsyncHandler.js";
import AuthServices from "../services/auth.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import Helper from "../utils/helper.js";
import EmployeeServices from "../services/employee.service.js";

const isProd = process.env.NODE_ENV === "production";

const getCookieDomain = (hostname) => {
  if (!hostname || hostname === "localhost") return undefined;

  const parts = hostname.split(".");

  // azzunique.cloud / primewebdev.in
  if (parts.length === 2) return hostname;

  // api.azzunique.cloud / www.primewebdev.in
  return parts.slice(-2).join(".");
};

const getCookieOptions = (req) => ({
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  domain: getCookieDomain(req.hostname),
  maxAge: 1000 * 60 * 60 * 24 * 7,
});

const getRefreshCookieOptions = (req) => ({
  ...getCookieOptions(req),
  maxAge: 1000 * 60 * 60 * 24 * 30,
});

class AuthController {
  static login = asyncHandler(async (req, res) => {
    const { user, accessToken, refreshToken } = await AuthServices.login(
      req.body,
      req,
      res
    );

    // Serialize and remove sensitive fields
    const safeUser = Helper.serializeUser(user);
    const {
      password,
      transactionPin,
      refreshToken: _,
      ...userWithoutSensitiveData
    } = safeUser;

    return res
      .status(200)
      .cookie("accessToken", accessToken, getCookieOptions(req))
      .cookie("refreshToken", refreshToken, getRefreshCookieOptions(req))
      .json(
        ApiResponse.success(
          { user: userWithoutSensitiveData, accessToken },
          `${userWithoutSensitiveData.email} login successful`,
          200
        )
      );
  });

  // GET CURRENT USER
  static getCurrentUser = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
      throw ApiError.unauthorized("User not authenticated");
    }
    try {
      let safeUser = await AuthServices.getUserById(userId, req, res);

      if (!safeUser) {
        throw ApiError.notFound("Business user not found");
      }

      return res
        .status(200)
        .json(
          ApiResponse.success(
            { user: safeUser },
            "Current business user fetched",
            200
          )
        );
    } catch (error) {
      console.error("Error fetching current business user:", error);
      throw ApiError.internal("Failed to fetch business user data");
    }
  });

  static logout = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const refreshToken = req.cookies?.refreshToken;

    if (!userId) throw ApiError.unauthorized("User not authenticated");

    await AuthServices.logout(userId, refreshToken, req, res);

    res.clearCookie("accessToken", getCookieOptions(req));
    res.clearCookie("refreshToken", getCookieOptions(req));

    return res
      .status(200)
      .json(ApiResponse.success(null, "Logout successful", 200));
  });

  static refreshToken = asyncHandler(async (req, res) => {
    const incomingRefresh = req.cookies?.refreshToken;

    if (!incomingRefresh) {
      throw ApiError.unauthorized("Refresh token missing");
    }

    const { accessToken, refreshToken, user } = await AuthServices.refreshToken(
      incomingRefresh,
      req,
      res
    );

    res.cookie("refreshToken", refreshToken, getRefreshCookieOptions(req));
    res.cookie("accessToken", accessToken, getCookieOptions(req));

    const safeUser = Helper.serializeUser(user);
    const {
      password,
      transactionPin,
      refreshToken: _,
      ...userWithoutSensitiveData
    } = safeUser;

    return res
      .status(200)
      .json(
        ApiResponse.success(
          { accessToken, user: userWithoutSensitiveData },
          "Token refreshed successfully",
          200
        )
      );
  });

  static requestPasswordReset = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw ApiError.badRequest("Email is required");
    }

    const result = await AuthServices.requestPasswordReset(email, req, res);

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  static confirmPasswordReset = asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
      throw ApiError.badRequest("Token is required");
    }

    const result = await AuthServices.confirmPasswordReset(token, req, res);

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  static verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.query;

    if (!token) {
      throw ApiError.badRequest("Token is required");
    }

    const result = await AuthServices.verifyEmail(String(token, req, res));

    return res.status(200).json(ApiResponse.success(null, result.message, 200));
  });

  static updateCredentials = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      throw ApiError.unauthorized("User not authenticated");
    }

    const credentialsData = req.body;

    const result = await AuthServices.updateCredentials(
      userId,
      credentialsData,
      currentUserId,
      req,
      res
    );

    const isUpdatingOwnAccount = currentUserId === userId;

    return res.status(200).json(
      ApiResponse.success(
        {
          isOwnUpdate: isUpdatingOwnAccount,
        },
        result.message,
        200
      )
    );
  });
}

export default AuthController;
