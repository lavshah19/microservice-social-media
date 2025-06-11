const { uploadMediaToCloudinary } = require('../utlis/cloudinary');
const logger = require('../utlis/logger');
const Media = require('../models/media');

const uploadMedia=async(req,res)=>{
    logger.info('upload media started');
    try{
        if (!req.file){
            logger.error('file not found');
            return res.status(400).json({
                success:false,
                message:'file not found please add file'
            });
        }
        const {originalname,buffer,mimetype}=req.file;
        const userId=req.user.userId;
        logger.info(`file details ${originalname} ${mimetype} ${buffer} ${userId}`);
        logger.info('upload media starting...');
        const clodinaryUploadResult=await uploadMediaToCloudinary(req.file);
        logger.info(`cloudinary upload successful, public id: ${clodinaryUploadResult.public_id} `);
        const newlyCreatedMedia= new Media({
          publicId:clodinaryUploadResult.public_id,
          originalName:originalname,
          mimeType:mimetype,
          userId,
          url:clodinaryUploadResult.secure_url,
         
        })
        await newlyCreatedMedia.save();
        logger.info('media saved to database');
        res.status(201).json({
            success:true,
            message:'media uploaded successfully',
            mediaId:newlyCreatedMedia._id,
            url:newlyCreatedMedia.url
        })
    }catch(err){
        logger.error(`error uploading media ${err}`);
        res.status(500).json({
            success:false,
            message:'internal server error'
        })
    }
}

const getAllMedias=async(req,res)=>{
    try {
        const medias=await Media.find({});
        if(!medias){
            res.status(404).json({
                success:false,
                message:"there is no media"
            })
        }
        res.status(200).json(medias)

        
    } catch (error) {
          logger.error(`error getting all media ${err}`);
        res.status(500).json({
            success:false,
            message:'error fetching media'
        })
    }
}

module.exports={
    uploadMedia,getAllMedias
}