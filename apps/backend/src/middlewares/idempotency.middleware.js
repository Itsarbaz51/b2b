import { ApiError } from "../utils/ApiError.js";
import { IdempotencyService } from "../services/idempotencyKey.service.js";

export const idempotencyMiddleware = (options = {}) => {
  const { required = true } = options;

  return async (req, res, next) => {
    try {
      const idempotencyKey = req.headers["idempotency-key"];

      if (!idempotencyKey) {
        if (required)
          return next(ApiError.badRequest("Idempotency key is required"));
        return next();
      }

      if (!/^[a-zA-Z0-9_-]{1,255}$/.test(idempotencyKey)) {
        return next(ApiError.badRequest("Invalid idempotency key format"));
      }

      const userId = req.user?.id;

      await IdempotencyService.processIdempotencyKey(idempotencyKey, userId);

      req.idempotencyKey = idempotencyKey;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default idempotencyMiddleware;