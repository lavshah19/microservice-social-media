require('dotenv').config();
const express=require('express');
const conectDB=require('./database/db');
const mongoose=require('mongoose');
const Redis=require('ioredis');
const cors=require('cors');
const helmet=require('helmet');
const postRoutes=require('./routes/post-routes');
const errorHandler=require('./middleware/errorHandler');
const logger=require('./utlis/logger');
const { connectToRabbitMQ } = require('./utlis/rabbit');

const app=express();
conectDB();


// Create Redis client using Redis URL from .env
const redisClient = new Redis(process.env.REDIS_URL); 

// Apply security-related middleware
app.use(cors()); // Allow cross-origin requests
app.use(helmet()); // Set secure HTTP headers
app.use(express.json()); // Parse incoming JSON requests

// Log every request's method, URL, and body
app.use((req, res, next) => {
  logger.info(`Request method: ${req.method} Request to: ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});

// add rate limit ip base for sensetive endpoints will do it later'

//routes_> pass redisClient to routes
app.use('/api/posts',(req, res, next) => {
  req.redisClient = redisClient;
  next();
},postRoutes);

// Error handling middleware
app.use(errorHandler);

// Start the server
const port = process.env.PORT || 3002;
async function startServer(){
  try{
    await connectToRabbitMQ();
    app.listen(port, () => {
  logger.info(`post service Server started on port ${port}`);
});
    

  }catch(error){
    logger.error('failed to connect to server',error);
    process.exit(1);

  }
}
startServer();




process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  // Optional: Close server and exit process for safety
  // server.close(() => {
  //   process.exit(1);
  // });
});
