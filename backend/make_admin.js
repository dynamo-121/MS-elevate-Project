const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/movieDB';
const email = process.argv[2];

if (!email) {
  console.log('Please provide an email address. Usage: node make_admin.js <email>');
  process.exit(1);
}

async function makeAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    const user = await User.findOneAndUpdate(
      { email: email },
      { role: 'admin' },
      { new: true }
    );
    
    if (user) {
      console.log(`Success! User ${email} is now an Admin.`);
    } else {
      console.log(`Error: Could not find user with email ${email}. Make sure you signed up first.`);
    }
    process.exit(0);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

makeAdmin();
