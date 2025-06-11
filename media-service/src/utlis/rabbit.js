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
async function consumeEvent(routingKey,callback){
    if(!channel){
        await connectToRabbitMQ()
    }
    const queue = await channel.assertQueue('', { exclusive: true });
    await channel.bindQueue(queue.queue, EXCHANGE_NAME, routingKey);
    channel.consume(queue.queue, (msg) => {
        if (msg !== null) {
            const message = JSON.parse(msg.content.toString());
            callback(message);
            channel.ack(msg);
        }
    });
    logger.info(`Listening for events on ${routingKey}`);
}
module.exports={connectToRabbitMQ,publishEvent,consumeEvent}  