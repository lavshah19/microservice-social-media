const mongoose = require('mongoose');
const postSchema =new mongoose.Schema({
user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
},
content:{
    type:String,
    required:true
},
mediaIds:[{
    type:String
}],


},{timestamps:true}); 
postSchema.index({content:'text'}); // this is for full text search
module.exports = mongoose.model('Post',postSchema);