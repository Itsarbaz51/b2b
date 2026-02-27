export const validateRequest = (schema) => {
  return async (req, res, next) => {
    const result = await schema.safeParseAsync(req.body);
    if (!result.success) {
      return next(result.error); 
    }
    req.body = result.data;
    next();
  };
};