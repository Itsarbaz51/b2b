import { rateLimit } from "express-rate-limit";

const rateLimiterMiddleware = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: "Too many requests, try again later",

  keyGenerator: (req) => {
    return (req.ip || "").replace(/^::ffff:/, "");
  },

  handler: (req, res) => {
    res.status(429).json({ error: "Too many requests, try again later" });
  },
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes

  max: 5, // max 5 OTP attempts

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },

  handler: (req, res) => {
    return res
      .status(429)
      .json(
        ApiResponse.error(
          "Too many OTP requests. Please try again after 5 minutes.",
          429
        )
      );
  },
});
export { rateLimiterMiddleware, otpLimiter };
