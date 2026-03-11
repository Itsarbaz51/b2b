export const validateRequest = (schemas) => {
  return async (req, res, next) => {
    try {
      if (schemas?.parseAsync) {
        const parsed = await schemas.parseAsync(req.body);
        Object.assign(req.body, parsed);
        return next();
      }

      // body
      if (schemas.body) {
        const parsed = await schemas.body.parseAsync(req.body);
        Object.assign(req.body, parsed);
      }

      // query
      if (schemas.query) {
        const parsed = await schemas.query.parseAsync(req.query);
        Object.assign(req.query, parsed);
      }

      // params
      if (schemas.params) {
        const parsed = await schemas.params.parseAsync(req.params);
        Object.assign(req.params, parsed);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
