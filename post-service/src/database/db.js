const mongoose = require('mongoose');
const logger = require('../utlis/logger');


const connectToDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('Connected to MongoDB');
        // console.log('Connected to MongoDB');
    } catch (error) {
        logger.error('Error connecting to MongoDB:', error);
        // console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = connectToDB;
