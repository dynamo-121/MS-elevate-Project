const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  genres: [{ type: String }],
  releaseYear: { type: Number },
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  language: { type: String },
  posterUrl: { type: String },
  trailerUrl: { type: String },
  cast: [{ type: String }],
  director: { type: String },
  popularity: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Movie', MovieSchema);
