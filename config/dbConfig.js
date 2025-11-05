const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
        
    // Connection events
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB Disconnected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB Connection Error:', err);mongoose.connect
    });
    
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;