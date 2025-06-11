
const logger = require("../utils/logger");
const User = require("../models/user");
const {validateRegistration,validateLogin}=require('../utils/validation');
const generateToken = require("../utils/generateToken");
const RefreshToken = require("../models/RefreshToken")

// user register
const registerUser = async (req, res) => {
    logger.info("registerUser endpoint hit ok");
  try {
    const {error}=validateRegistration(req.body);
    if(error){
       logger.warn("validation error",error.details[0].message);
       return res.status(400).json({
        success:false,
        message:error.details[0].message});
    }
    const {email,password,username} = req.body;
    let userExist = await User.findOne({$or:[{email},{username}]});
    if(userExist){
        logger.warn("user already exist");
        return res.status(400).json({
            success:false,
            message:"user already exist"});
    }
    

    const user = new User({
      email,
      password,
      username,
    });

    await user.save();
    logger.info("user registered successfully");
    const {accessToken,refreshToken}=await generateToken(user);
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      accessToken,
      refreshToken,
    });
   
    
  } catch (error) {
    logger.error("registerUser error",error);
    res.status(400).json({ 
        success: false,
        error: error.message });
  }
};

// login
const loginUser = async(req,res)=>{
  logger.info("loginUser endpoint hit ok");
  try {
    const {error}=validateLogin(req.body);
    if(error){
      logger.warn("validation error",error.details[0].message);
      return res.status(400).json({
        success:false,
        message:error.details[0].message});
    }
    const {email,password} = req.body;
    const user = await User.findOne({email});
    if(!user){
      logger.warn("user not found");
      return res.status(400).json({
        success:false,
        message:"user not found"});
      }
      // verify password
    const isMatch = await user.comparePassword(password);
    if(!isMatch){
      logger.warn("invalid password");
      return res.status(400).json({
        success:false,
        message:"invalid password"});
    }
    const {accessToken,refreshToken}=await generateToken(user);
    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      accessToken,
      refreshToken,
    });

    
    }
    catch(error){
      logger.error("loginUser error",error);
      res.status(400).json({ 
        success: false,
        error: error.message });
    }
   

}
const refreshTokenUser=async (req,res)=>{
  logger.info("refreshToken endpoint hit ok");
  try {
    const {refreshToken}=req.body;
    if(!refreshToken){
      logger.warn("refresh token not found");
      return res.status(400).json({
        success:false,
        message:"refresh token not found"});
    }
    const storedRefreshToken=await RefreshToken.findOne({token:refreshToken});
    if(!storedRefreshToken || storedRefreshToken.expiresAt<Date.now()){
      logger.warn("refresh token not found or expired");
      return res.status(400).json({
        success:false,
        message:"refresh token not found or expired"});
      
    }
    const user=await User.findById(storedRefreshToken.userId);
    if(!user){
      logger.warn("user not found");
      return res.status(400).json({
        success:false,
        message:"user not found"});
    }
    const {accessToken:newAccessToken,refreshToken:newRefreshToken}=await generateToken(user);
    await RefreshToken.deleteOne({_id:storedRefreshToken._id});
    res.status(200).json({
      success: true,
      message: "refresh token generated successfully",
      accessToken:newAccessToken,
      refreshToken:newRefreshToken,});


  
    

   

}catch(error){
  logger.error("refreshToken error",error);
  res.status(400).json({ 
    success: false,
    error: error.message });
}
}
//logoutUser
const logoutUser=async(req,res)=>{
  logger.info("logoutUser endpoint hit ok");
  try {
    const {refreshToken}=req.body;
    if(!refreshToken){
      logger.warn("refresh token not found");
      return res.status(400).json({
        success:false,
        message:"refresh token not found"});
    }
    const storedRefreshToken=await RefreshToken.findOne({token:refreshToken});
    if(!storedRefreshToken){
      logger.warn("refresh token not found");
      return res.status(400).json({
        success:false,
        message:"refresh token not found"});
    }
    await RefreshToken.deleteOne({_id:storedRefreshToken._id});
    res.status(200).json({
      success: true,
      message: "logout successfully",
    });
  } catch (error) {
    logger.error("logoutUser error",error);
    res.status(400).json({ 
      success: false,
      error: error.message });
  }
}



module.exports = { registerUser,loginUser,refreshTokenUser,logoutUser };