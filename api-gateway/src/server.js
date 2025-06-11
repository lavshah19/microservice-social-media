require('dotenv').config(); // Load environment variables from .env file into process.env

const express = require("express");
const cors = require("cors"); // Enable Cross-Origin Resource Sharing
const Redis = require("ioredis"); // Redis client for caching and rate limiting
const helmet = require("helmet"); // Adds security-related HTTP headers
const { rateLimit } = require("express-rate-limit"); // Express middleware for rate limiting
const { RedisStore } = require('rate-limit-redis'); // Redis-backed store for rate limiter
const logger = require('./utils/logger'); // Custom logger using Winston
const proxy = require('express-http-proxy'); // Middleware to proxy requests to other services
const errorHandler = require('./middleware/errorHandler'); // Centralized error handling middleware
const { validateToken } = require('./middleware/authMiddleware');

const app = express();
const port = process.env.PORT || 3000; // Default to 3000 if no PORT specified


// Create a new Redis client instance using connection string from environment variable
const redisClient = new Redis(process.env.REDIS_URL);

app.use(helmet()); // Adds security headers to all responses (e.g., Content-Security-Policy)
app.use(cors()); // Enables CORS so frontend apps on other domains can access this API
app.use(express.json()); // Parses incoming JSON request bodies to JS objects

// Configure and apply rate limiting to all incoming requests to prevent abuse or DDoS attacks
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Time window for rate limit (15 minutes)
  max: 100, // Max number of requests allowed per IP during this window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers (recommended)
  legacyHeaders: false, // Disable deprecated `X-RateLimit-*` headers
  handler: (req, res, next) => { // What happens when a client exceeds rate limit
    logger.warn(`Request from ${req.ip} is rate limited`); // Log rate limiting event
    res.status(429).json({ success: false, message: 'Too many requests' }); // Return 429 error
  },
  store: new RedisStore({ // Use Redis to store rate limit counters, shared across instances
    sendCommand: (...args) => redisClient.call(...args), // How Redis commands are sent
  }),
});
app.use(rateLimiter); // Apply this rate limiter middleware globally to all routes

// Logging middleware for each incoming request to help debugging and monitoring
app.use((req, res, next) => {
  logger.info(`Request method: ${req.method} Request to: ${req.url}`); // Log HTTP method and URL
  logger.info(`Request body: ${JSON.stringify(req.body)}`); // Log the request payload/body
  next(); // Proceed to next middleware or route handler
});

// Proxy configuration to forward certain requests to the identity service
const proxyOptions = {
  // Modify the path of the proxied request to replace "/v1" with "/api"
  // This allows your gateway to expose a consistent API versioning path,
  // while forwarding to backend services that use a different base path
  proxyReqPathResolver: (req) => {
    return req.originalUrl.replace(/^\/v1/, '/api');
  },

  // Error handling middleware for proxy failures
  // Logs the error and returns a generic 500 response to the client
  proxyErrorHandler: (err, res, next) => {
    logger.error("proxy error:", err.message);
    res.status(500).json({ error: err.message, message: 'Internal server error' });
  },
};

// Apply the proxy middleware for routes starting with "/v1/auth"
// Forward these requests to the identity service URL defined in environment variables
app.use('/v1/auth', proxy(process.env.IDENTITY_SERVICE_URL, {
  ...proxyOptions, // Include the shared proxy options

 

  // Modify the outgoing proxied request options before sending to backend
  // Here, explicitly set Content-Type header to application/json to ensure backend correctly parses requests
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['Content-Type'] = 'application/json';
    return proxyReqOpts; // Must return modified options object
  },

  // After receiving response from backend service, log it and return the response data unchanged
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    logger.info(`Response from identity service ${proxyRes.statusCode}: ${proxyResData}`);
    return proxyResData; // Forward backend response data back to the original client 
  }
}));
// setting up proxy for post service
app.use('/v1/posts',validateToken,proxy(process.env.POST_SERVICE_URL,{
  ...proxyOptions,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['Content-Type'] = 'application/json'
    proxyReqOpts.headers['x-user-id']=srcReq.user.userId

    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    logger.info(`Response from post service ${proxyRes.statusCode}: ${proxyResData}`);
    return proxyResData;
  }
}));
// setting up proxy for media service
app.use('/v1/media',validateToken,proxy(process.env.MEDIA_SERVICE_URL,{
  ...proxyOptions,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    
    proxyReqOpts.headers['x-user-id']=srcReq.user.userId
    const contentType = proxyReqOpts.headers['content-type'] || '';

  if (!contentType.startsWith('multipart/form-data')) {
    proxyReqOpts.headers['Content-Type'] = 'application/json';
  }

    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    logger.info(`Response from post service ${proxyRes.statusCode}: ${proxyResData}`);
    return proxyResData;
  },
  parseReqBody: false, 
}));

// setting up proxy for search service
app.use('/v1/search',validateToken,proxy(process.env.SEARCH_SERVICE_URL,{
  ...proxyOptions,
  proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
    proxyReqOpts.headers['Content-Type'] = 'application/json'
    proxyReqOpts.headers['x-user-id']=srcReq.user.userId

    return proxyReqOpts;
  },
  userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
    logger.info(`Response from SEARCH service ${proxyRes.statusCode}: ${proxyResData}`);
    return proxyResData;
  }
}));

app.use(errorHandler); // Global error handler to catch any unhandled errors in the app

app.listen(port, () => {
  // Log server startup info to help verify environment config and running services
  logger.info(`API gateway is listening on port ${port}`);
  logger.info(`Identity service url: ${process.env.IDENTITY_SERVICE_URL}`);
  logger.info(`Post service url: ${process.env.POST_SERVICE_URL}`);
  logger.info(`Redis url: ${process.env.REDIS_URL}`);
  logger.info(`Media service url: ${process.env.MEDIA_SERVICE_URL}`);
  logger.info(`search service url: ${process.env.SEARCH_SERVICE_URL}`);

});
