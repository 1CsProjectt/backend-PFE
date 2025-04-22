
export const injectCurrentSession = (req, res, next) => {
    const originalJson = res.json.bind(res);
  
    res.json = (body) => {
      if (body && typeof body === 'object') {
        body.currentSessions = res.locals.currentSessions || [];
      }
      return originalJson(body);
    };
  
    next();
  };
  