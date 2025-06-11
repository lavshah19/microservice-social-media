
const logger=require('../utils/logger');
const jwt =require('jsonwebtoken');


const validateToken =(req,res,next)=>{
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if(!token){
        logger.error('Token not provided');
        return res.status(401).json({
            success:false,
            message:'Token not provided'});
    }
     jwt.verify(token,process.env.JWT_SECRET,(err,user)=>{
        if(err){
            logger.error('Token verification failed');
            return res.status(401).json({
                success:false,
                message:'Token verification failed'});
        }
        req.user=user;
        next();
    });
}
module.exports={validateToken};