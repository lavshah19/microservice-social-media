const ampq=require("amqplib");
const logger=require('./logger');
let connection= null;
let channel=null;
const EXCHANGE_NAME='facebook_event'


async function connectToRabbitMQ(){
    try{
        connection =await ampq.connect(process.env.RABBITMQ_URL);
        channel=await connection.createChannel();
        await channel.assertExchange(EXCHANGE_NAME,'topic',{durable:false});
        logger.info('connected to rabbit mq')

    }catch(error){
        logger.error('error connecting to rabbitmq ',error) 
    }
}
async function publishEvent(routingKey,message){
    if(!channel){
        await connectToRabbitMQ()
    }
    channel.publish(EXCHANGE_NAME,routingKey,Buffer.from(JSON.stringify(message)))
    logger.info(`Event publish:${routingKey}`);
    

    

}   
module.exports={connectToRabbitMQ,publishEvent}