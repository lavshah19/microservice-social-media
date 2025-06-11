const logger=require('../utlis/logger');
const authenticateRequest=async(req,res,next)=>{
    try{
        const userId=req.headers['x-user-id'];
       
        if(!userId){
            logger.error('user id not found');
            return res.status(401).send({
                success:false,
                message:'unauthorized user request'
            });
        }
    
       
        // Assuming you have a way to verify the user ID, e.g., checking against a database
        req.user={userId};
        next();

    }
    catch(error){
        logger.error(error);
        res.status(401).send({message:'unauthorized'});
    }
}
module.exports=authenticateRequest;
