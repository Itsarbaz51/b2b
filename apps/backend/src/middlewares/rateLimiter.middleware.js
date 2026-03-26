import { ipKeyGenerator, rateLimit } from "express-rate-limit";

// 🔒 Global limiter
export const rateLimiterMiddleware = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: "Too many requests, try again later",

  keyGenerator: (req) => ipKeyGenerator(req),

  handler: (req, res) => {
    return res.status(429).json({
      status: "error",
      message: "Too many requests, try again later",
    });
  },
});

// 🔐 OTP limiter
export const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => req.user?.id || ipKeyGenerator(req),

  handler: (req, res) => {
    return res.status(429).json({
      status: "error",
      message: "Too many OTP requests. Try again after 5 minutes.",
    });
  },
});
