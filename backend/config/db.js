const mongoose = require('mongoose');

let cachedConnection = null;

const connectDB = async () => {
    // If we have a cached connection and it's ready, reuse it
    if (cachedConnection && mongoose.connection.readyState === 1) {
        console.log('Using cached MongoDB connection');
        return cachedConnection;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/siraba_organic', {
            serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
            socketTimeoutMS: 45000,
            bufferCommands: false, // Disable buffering for serverless
            maxPoolSize: 10, // Connection pooling
        });

        console.log(`MongoDB Connected: ${conn.connection.host}`);
        cachedConnection = conn;
        return conn;
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
        // Don't exit in serverless environment
        if (process.env.NODE_ENV !== 'production') {
            process.exit(1);
        }
        throw error;
    }
};

module.exports = connectDB;
