
const Media = require('../models/media');

const logger = require('../utlis/logger');
const {deleteMediaFromCloudinary}=require('../utlis/cloudinary')

const handelPOstDeleted = async (event) => {
   // console.log(`Handling post deleted event: ${JSON.stringify(event)}`);
   try {
    const { postId,mediaIds } = event;
    if (!postId || !mediaIds || mediaIds.length === 0) {
      logger.error(`Invalid event data: postId or mediaIds is missing for postId: ${postId}`);
      return;
    }
    const mediaToDelete= await Media.find({_id: { $in: mediaIds } }); // Find media files associated with the postId
    //$in operator is used to find documents where the _id field matches any of the values in the mediaIds array.
    if (!mediaToDelete || mediaToDelete.length === 0) {
      logger.error(`No media found for postId: ${postId}`);
      return ;
    }
    // if (!mediaToDelete || mediaToDelete.length === 0) {
    //   logger.error(`No media found for postId: ${postId}`);
      
    //   return;
    // }
    for (const media of mediaToDelete) {
    
      await deleteMediaFromCloudinary(media.publicId);
     await Media.findByIdAndDelete(media._id);
      logger.info(`Media file deleted for postId: ${postId}, mediaId: ${media._id}`);
    }
    logger.info(`Post deleted event handled successfully for postId: ${postId}`);
    
   } catch (error) {
     logger.error(`Error handling media post deleted event: ${error.message}`);
    
   }
    
  
 

  
 
}
module.exports = {
  handelPOstDeleted
};