/**
 * Logger Middleware
 * Intercepts HTTP requests and logs performance stats, route path, status codes, and user tenants.
 */
const loggerMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Attempt to resolve tenant identity across different parameters
    const tenantId = 
      req.headers['x-user-id'] || 
      req.query.userId || 
      (req.body && req.body.userId) || 
      (req.params && req.params.userId) ||
      'Anonymous';

    console.log(
      `[LOG] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ` +
      `Status: ${res.statusCode} | Tenant: ${tenantId} | Duration: ${duration}ms`
    );
  });

  next();
};

module.exports = loggerMiddleware;
