const cloudinary = require('cloudinary').v2;
const logger=require('./logger');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
   
});
const uploadMediaToCloudinary = async (file) => {
  return new Promise((resolve, reject)=>{
    const uploadStream = cloudinary.uploader.upload_stream(
        {resource_type: 'auto'},
        (error, result) => {
            if (error) {
                logger.error("error while uploading media to cloudinary",error);
                reject(error);
            }
            resolve(result);
        }
    );
    uploadStream.end(file.buffer); // this is the buffer of the file which we are uploading to cloudinary 
  })
};
const deleteMediaFromCloudinary = async (publicId)=>{
  try {
    const result=await cloudinary.uploader.destroy(publicId);
    logger.info('media deleted from clodinary',publicId)
    return result;
    
  } catch (error) {
    logger.error('error deleting media from cloudinary',error)
  }
}
module.exports = { uploadMediaToCloudinary,deleteMediaFromCloudinary };