const mongoose = require('mongoose');
const searchPostSchema = new mongoose.Schema({
    userId: {
        type: String,
     
        // This field is unique to ensure that each user can only have one search post
        required: true,
        index: true,
        // This field is required to link the search post to a specific user 
        
    },
    postId: {
        type: String,
        required: true,
        unique: true,
        // This field is required to link the search post to a specific post
    },
    content:{
        type: String,
        required: true,
        index: true,
        // Create a text index on the content field for full-text search capabilities
        // This field is required to store the content of the search post

    },
    createdAt: {
        type: Date,
        required: true,
        
    }
}, { timestamps: true });
// Create a text index on the content field for full-text search capabilities
searchPostSchema.index({ content: 'text' });
searchPostSchema.index({createdAt: -1}); // Index for sorting by creation date
// Export the SearchPost model based on the searchPostSchema
module.exports = mongoose.model('SearchPost', searchPostSchema);