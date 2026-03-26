import { rateLimit } from "express-rate-limit";

const rateLimiterMiddleware = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 100,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: "Too many requests, try again later",

  keyGenerator: (req) => {
    return ipKeyGenerator(req); // ✅ FIX (IPv6 safe)
  },

  handler: (req, res) => {
    res.status(429).json({ error: "Too many requests, try again later" });
  },
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => {
    // 👇 safe fallback
    return req.user?.id || ipKeyGenerator(req);
  },

  handler: (req, res) => {
    return res.status(429).json({
      error: "Too many OTP requests. Please try again after 5 minutes.",
    });
  },
});
export { rateLimiterMiddleware, otpLimiter };
