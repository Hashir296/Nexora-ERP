const mongoose = require('mongoose');
const config = require('./index');

let connecting = null;

async function connectDB() {
  mongoose.set('strictQuery', true);

  // Reuse connection across Vercel serverless invocations
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connecting) return connecting;

  connecting = mongoose
    .connect(config.mongoUri, {
      bufferCommands: false,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 10000,
    })
    .then((conn) => {
      console.log(`MongoDB connected: ${conn.connection.name}`);
      connecting = null;
      return conn;
    })
    .catch((err) => {
      connecting = null;
      throw err;
    });

  return connecting;
}

module.exports = connectDB;
