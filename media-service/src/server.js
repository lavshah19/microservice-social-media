require('dotenv').config();
const express=require('express');
const conectDB=require('./database/db');
const mongoose=require('mongoose');
const Redis=require('ioredis');
const cors=require('cors');
const helmet=require('helmet');

const errorHandler=require('./middleware/errorHandler');
const logger=require('./utlis/logger')
const mediaRoutes=require('./routes/media-routes');
const { connectToRabbitMQ, consumeEvent } = require('./utlis/rabbit');
const { handelPOstDeleted } = require('./eventHandler/media-event-handler');

const app=express();
const port=process.env.PORT || 3003; 
conectDB();
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Request method: ${req.method} Request to: ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`);
  next();
});


// impememnt ip base rate limiting for sensetive endpoints i will do later
app.use('/api/media',mediaRoutes);
async function startServer(){
    try{
    await connectToRabbitMQ();
    //consume event
    await consumeEvent('post.deleted',handelPOstDeleted)

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