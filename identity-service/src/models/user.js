const mongoose = require('mongoose');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
        unique:true,
        trim: true
    },
    email: {
       
        type: String,
        required: true,
        unique: true,
         lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6,
    } 


}
,{timestamps: true});

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        try{
         this.password = await argon2.hash(this.password);
        }
        catch(err){
           return next(err);
        }
       
    }
    next();
   
});
userSchema.methods.comparePassword = async function (candidatePassword) {
    try {
        const isMatch = await argon2.verify(this.password, candidatePassword);
        return isMatch;
    } catch (err) {
     throw err;
    }
};
userSchema.index({username:"text"})

module.exports=mongoose.model('User',userSchema);