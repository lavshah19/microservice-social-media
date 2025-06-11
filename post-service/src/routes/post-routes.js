const express = require('express');
const router = express.Router();
const{createPost,getAllPosts,getPostById,updatePost,deletePost}=require('../controllers/post-controller');
const authenticateRequest=require('../middleware/auth-middleware')

router.use(authenticateRequest);
router.post('/create-post',createPost);
router.get('/allposts',getAllPosts);
router.get('/get-post/:id',getPostById);
router.put('/update-post/:id',updatePost);
router.delete('/delete-post/:id',deletePost);



module.exports=router;
