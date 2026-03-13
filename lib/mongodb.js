import mongoose from "mongoose";

// Log MongoDB connection events and debug queries
mongoose.connection.on('connected', () => console.log('\n[MongoDB Logs] Successfully connected to database'));
mongoose.connection.on('error', (err) => console.error('\n[MongoDB Logs] Connection error:', err));
mongoose.set('debug', true); // This will log all queries sent to MongoDB

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local",
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
