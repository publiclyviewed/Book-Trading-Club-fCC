const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Load .env from backend root

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose v6.0+ options are default, can remove these if using recent version
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true, // if needed for older versions/specific indexes
      // useFindAndModify: false // if needed for older versions/specific updates
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

module.exports = connectDB;