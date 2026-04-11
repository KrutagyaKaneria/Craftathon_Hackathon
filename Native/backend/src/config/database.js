import mongoose from 'mongoose';

let dbConnected = false;

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/driveguard';
    
    console.log('🔗 Attempting to connect to MongoDB...');
    console.log('   URI:', mongoURI.substring(0, 50) + '...' );

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });

    dbConnected = true;
    console.log('✅ MongoDB Connected Successfully');
    
    // Set up connection event listeners
    mongoose.connection.on('disconnected', () => {
      dbConnected = false;
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('error', (error) => {
      dbConnected = false;
      console.error('⚠️  MongoDB connection error:', error.message);
    });

  } catch (error) {
    dbConnected = false;
    console.error('❌ MongoDB Connection Error:', error.message);
    console.error('   This may cause API errors when querying the database');
    console.log('   Ensure MongoDB is running and accessible at the configured URI');
  }
};

export const isDbConnected = () => {
  return dbConnected && mongoose.connection.readyState === 1;
};

export const disconnectDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      dbConnected = false;
      console.log('✅ MongoDB Disconnected');
    }
  } catch (error) {
    console.error('❌ MongoDB Disconnection Error:', error.message);
  }
};
