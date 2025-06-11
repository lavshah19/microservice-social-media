const jwt=require("jsonwebtoken");
const crypto = require("crypto");
const RefreshToken=require("../models/RefreshToken");

const generateToken = async(user) => {
    const accessToken = await jwt.sign({ userId: user._id,username: user.username }, process.env.JWT_SECRET, {
        expiresIn: "60m",
    });

    const refreshToken = crypto.randomBytes(40).toString("hex");
    const refreshTokenExpiry = new Date(); 
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    await RefreshToken.create({
        token: refreshToken,
        expiresAt: refreshTokenExpiry,
        userId: user._id,
    });
    return { accessToken, refreshToken };

   
};

module.exports = generateToken;
