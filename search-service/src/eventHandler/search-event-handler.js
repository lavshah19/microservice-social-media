const logger = require("../utlis/logger");

const SearchPost = require("../models/search");

async function handelPostCreated(event){
    try{
        const { postId, userId, content, createdAt } = event;
        logger.info('Handling post created event:', event);
        // Create a new search post entry
        const newPost = new SearchPost({
            postId,
            userId,
            content,
            createdAt,
        });
        // Save the new post to the database
        await newPost.save();
        logger.info('Post created event handled successfully:', newPost);

    }catch(error){
        logger.error('Error handling post created event:', error);
    }
}
async function handelPostDeleted(event){
    try {
        const { postId } = event;
        logger.info('Handling post deleted event:', event);
        // Delete the post from the search index
        await SearchPost.deleteOne({ postId });
        logger.info('Post deleted event handled successfully for postId:', postId);
    } catch (error) {
        logger.error('Error handling post deleted event:', error);
    }
}
module.exports={handelPostCreated,handelPostDeleted}