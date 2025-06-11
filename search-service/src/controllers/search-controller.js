


const logger=require('../utlis/logger');
const SearchPost = require('../models/search');
const searchPostController = async (req, res) => {
logger.info('search controller called');
try {
    const {query} = req.query;
    const result = await SearchPost.find(
        {
            $text:{
                $search:query
            },
        },
        {
            score: { $meta: "textScore" },
        }
    ).sort({
        score: { $meta: "textScore" },
    }).limit(10);
    if (!result || result.length === 0) {
        logger.info('No posts found for the search query');
        return res.status(404).json({
            success: false,
            message: 'No posts found for the search query',
        });
    }
    logger.info(`search result ${result}`);
    res.status(200).json({
        success: true,
        message: 'search post successfully',
        data: result,
    });
    
} catch (err) {
     logger.error(`error searching post ${err}`);
        res.status(500).json({
            success:false,
            message:'internal server error during search post',
        })
    
}


}
module.exports = {
    searchPostController,
}; 