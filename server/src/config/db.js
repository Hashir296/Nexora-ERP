const mongoose = require('mongoose');
const config = require('./index');

async function connectDB() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri);
  console.log(`MongoDB connected: ${config.mongoUri}`);
}

module.exports = connectDB;
