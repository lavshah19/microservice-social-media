const logger = require('../utlis/logger');
const Post = require('../models/post');
const {validateCreatePost}=require('../utlis/validation');
const { publishEvent } = require('../utlis/rabbit');

const invalidPostCache=async(req,input)=>{
    try{
        const cacheKey=`posts:${input}`;
        await req.redisClient.del(cacheKey);
        
const keys=await req.redisClient.keys('posts:*'); 
if(keys.length>0){
    await req.redisClient.del(keys);
    logger.info("Post cache invalidated");
}

        
        
    }catch(error){
        logger.error("Error invalidating post cache",error);
    }
}

const createPost=async(req,res)=>{
    logger.info("create post controller end point hit")
    try{
        
        const {error}=validateCreatePost(req.body);
        if(error){
            logger.error("Error creating post",error);
            return res.status(400).json({
                success:false,
                message:error.details[0].message
               })
        }
        const {content,mediaIds}=req.body;
      const newlyCreatedPost=new Post({
        user:req.user.userId,
        content,
        mediaIds:  mediaIds || []
      })
      await newlyCreatedPost.save();
      await publishEvent('post.created',{
        postId:newlyCreatedPost._id.toString(), // postId of the newly created post
        userId:req.user.userId, // userId of the creator
        content:newlyCreatedPost.content, // content of the newly created post
        createdAt:newlyCreatedPost.createdAt, // createdAt of the newly created post
      });
      await invalidPostCache(req,newlyCreatedPost._id.toString());

      logger.info("Post created successfully",newlyCreatedPost);
      res.status(201).json({
        success:true,
        message:"Post created successfully",
        post:newlyCreatedPost
       })
    }catch(error){
       logger.error("Error creating post",error);
       res.status(400).json({
        success:false,
        message:"Error creating post"
       })
    }
}
const getAllPosts=async(req,res)=>{
    try{
        const page=parseInt(req.query.page) || 1;
        const limit=parseInt(req.query.limit) || 10;
        const skip=(page-1)*limit;
        const cacheKey=`posts:${page}:${limit}`;
        const cachePost= await req.redisClient.get(cacheKey);
        if(cachePost){
            logger.info("Posts fetched from cache");
            return res.status(200).json({
                success:true,
                message:"Posts fetched successfully from cache ",
                posts:JSON.parse(cachePost)
               })
        }
        const totalPosts=await Post.countDocuments({});
        const totalPages=Math.ceil(totalPosts/limit);

       const posts= await Post.find({}).sort({createdAt:-1}).skip(skip).limit(limit);
       const result={
        posts,
        totalPages,
        currentPage:page,
        totalPosts
       }
       // save your post in cache redis
       await req.redisClient.setex(cacheKey,3600,JSON.stringify(result));
       logger.info("Posts fetched successfully");
       
       res.status(200).json({
            success:true,
            message:"Posts fetched successfully",
            result
           })
          
      
    }catch(error){
       logger.error("Error getting all posts",error);
       res.status(400).json({
        success:false,
        message:"Error getting all posts "
       })
    }
}
const getPostById=async(req,res)=>{
    try{
         const postId=req.params.id;
         const cacheKey=`posts:${postId}`;
         const cachePost= await req.redisClient.get(cacheKey);
         if(cachePost){
            logger.info("Post fetched from cache");
            return res.status(200).json({
                success:true,
                message:"Post fetched successfully from cache",
                post:JSON.parse(cachePost)
               })
         }
         const post= await Post.findById(postId);
         if(!post){
            logger.error("Post not found");
            return res.status(404).json({
                success:false,
                message:"Post not found"
               })
         }
         await req.redisClient.setex(cacheKey,3600,JSON.stringify(post));
         logger.info("Post fetched successfully");
         res.status(200).json({
            success:true,
            message:"Post fetched successfully",
            post
           })

      
    }catch(error){
       logger.error("Error getting post by id",error);
       res.status(400).json({
        success:false,
        message:"Error getting post by id"
       })
    }
}
const updatePost=async(req,res)=>{
    try{
        const postId=req.params.id;
        const {content,mediaIds}=req.body;
        const post=await Post.findById(postId);
        if(!post){
            logger.error("Post not found");
            return res.status(404).json({
                success:false,
                message:"Post not found"
               })
        }
        const creator=req.user.userId;
        if(creator.toString()!==post.user.toString()){
            logger.error("You are not authorized to update this post");
            return res.status(401).json({
                success:false,
                message:"You are not authorized to update this post"
               })
        }
        


        const updatePost= await Post.findByIdAndUpdate(postId,{
            content,
            mediaIds:  mediaIds || []
          },{new:true});
          //invalidate post cache
          await invalidPostCache(req,postId);
          logger.info("Post updated successfully");
          res.status(200).json({
            success:true,
            message:"Post updated successfully",
            post:updatePost
           })
      
    }catch(error){
       logger.error("Error updating post",error);
       res.status(400).json({
        success:false,
        message:"Error updating post"
       })
    }
}
const deletePost=async(req,res)=>{
    try{
        const postId=req.params.id;
        const post=await Post.findById(postId);
        if(!post){
            logger.error("Post not found");
            return res.status(404).json({
                success:false,
                message:"Post not found"
               })
        }
        const creator=req.user.userId;
        if(creator.toString()!==post.user.toString()){
            logger.error("You are not authorized to delete this post");
            return res.status(401).json({
                success:false,
                message:"You are not authorized to delete this post"
               })
        }
        await Post.findByIdAndDelete(postId);
        //publish post deleted event to rabbitmq
        await publishEvent('post.deleted',{
            postId:postId, // postId of the deleted post
            userId:req.user.userId ,//or creator
            mediaIds:post.mediaIds // mediaIds of the deleted post
        });


        //invalidate post cache
        await invalidPostCache(req,postId);
        logger.info("Post deleted successfully");
        res.status(200).json({
            success:true,
            message:"Post deleted successfully"
           })

      
    }catch(error){
       logger.error("Error deleting post",error);
       res.status(400).json({
        success:false,
        message:"Error deleting post"
       })
    }
}
module.exports={createPost,getAllPosts,getPostById,updatePost,deletePost}
