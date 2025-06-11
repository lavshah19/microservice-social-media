require('dotenv').config();
const express=require('express');
const conectDB=require('./database/db');
const mongoose=require('mongoose');
const Redis=require('ioredis');
const cors=require('cors');
const helmet=require('helmet');
const errorHandler=require('./middleware/errorHandler');
const logger=require('./utlis/logger');
const { connectToRabbitMQ,consumeEvent } = require('./utlis/rabbit');
const searchRoutes=require('./routes/search-routes');
const connectToDB = require('./database/db');
const { handelPostCreated, handelPostDeleted } = require('./eventHandler/search-event-handler');
const { handelPOstDeleted } = require('../../media-service/src/eventHandler/media-event-handler');
const app=express();
app.use(cors());
app.use(express.json());
app.use(helmet());
// Connect to MongoDB
connectToDB();
// Connect to Redis

app.use((req, res, next) => {
  logger.info(`Request method: ${req.method} Request to: ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});
 


// impememnt ip base rate limiting for sensetive endpoints i will do later
app.use('/api/search', searchRoutes);
const port=process.env.PORT || 3004;
async function startServer(){
    try{
    await connectToRabbitMQ();
    //consume event 

    await consumeEvent('post.created',handelPostCreated);
    await consumeEvent('post.deleted',handelPostDeleted)

    app.listen(port, () => {
  logger.info(`media service Server started on port ${port}`);
});
    

  }catch(error){
    logger.error('failed to connect to server',error);
    process.exit(1);

  }
}
startServer();


app.use(errorHandler);

process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
  // Optional: Close server and exit process for safety
  // server.close(() => {
  //   process.exit(1);
  // });
});
