const mongoose = require('mongoose');
require('dotenv').config();
const { syncMoviesFromCSV } = require('./controllers/movieController');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/movieDB')
  .then(() => {
    console.log('Connected to DB. Starting sync...');
    const req = {};
    const res = {
      json: (data) => { console.log('Success:', data); process.exit(0); },
      status: (code) => ({ json: (data) => { console.error('Error:', code, data); process.exit(1); } })
    };
    syncMoviesFromCSV(req, res);
  }).catch(err => {
    console.error('Connection error:', err);
    process.exit(1);
  });
