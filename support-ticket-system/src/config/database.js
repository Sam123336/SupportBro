const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Set strictQuery to false to prepare for Mongoose 7
        mongoose.set('strictQuery', false);
        
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;