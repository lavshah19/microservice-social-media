require('dotenv').config();
const logger = require('./utils/logger');
const connectToDb = require('./database/db');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const { rateLimit } = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const routes = require('./routes/identity-service');
const errorHandler = require('./middleware/errorHandler');
const Redis = require('ioredis');

const app = express();
const port = process.env.PORT || 3001;

connectToDb();

const redisClient = new Redis(process.env.REDIS_URL);

app.use(cors());
app.use(helmet());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Request method: ${req.method} Request to: ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  keyPrefix: 'rateLimit',
  points: 10,
  duration: 1,
});

app.use((req, res, next) => {
  rateLimiter.consume(req.ip)
    .then(() => {
      next();
    })
    .catch(() => {
      logger.warn(`Request from ${req.ip} is rate limited`);
      res.status(429).json({ success: false, message: 'Too many requests' });
    });
});

const sensetiveEndPointRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    logger.warn(`Request from ${req.ip} is rate limited`);
    res.status(429).json({ success: false, message: 'Too many requests' });
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
  }),
});

app.use('/api/auth/register', sensetiveEndPointRateLimiter);
// app.use('/api/auth/login', sensetiveEndPointRateLimiter);
app.use('/api/auth', routes);
app.use(errorHandler);

app.listen(port, () => {
  logger.info(`Identity service Server is running on port ${port}`);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});
