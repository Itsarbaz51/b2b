import { rateLimit } from "express-rate-limit";

const rateLimiterMiddleware = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: "Too many requests, try again later",

  handler: (req, res) => {
    res.status(429).json({ error: "Too many requests, try again later" });
  },
});

export { rateLimiterMiddleware };
