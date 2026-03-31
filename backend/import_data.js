const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();
const Movie = require('./models/Movie');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/movieDB';

async function importData() {
  try {
    console.log(`Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // Clear existing movies to avoid duplicates from multiple runs
    console.log('Clearing existing movies collection...');
    await Movie.deleteMany({});
    console.log('Finished clearing movies.');

    const moviesToInsert = [];

    console.log('Reading data/movies.csv...');
    fs.createReadStream('./data/movies.csv')
      .pipe(csv())
      .on('data', (row) => {
        let genres = [];
        if (row.genres) {
          genres = row.genres.split(',').map(s => s.trim());
        }

        let releaseYear = 2000;
        if (row.release_date) {
          const parts = row.release_date.split('-');
          if (parts.length === 3) releaseYear = parseInt(parts[2], 10);
          else releaseYear = parseInt(parts[0], 10);
        }

        if (row.title && row.overview) {
          const tmdbPosterUrl = row.poster_path ? `https://image.tmdb.org/t/p/w500${row.poster_path}` : null;

          const movie = {
            title: row.title || 'Unknown Title',
            description: row.overview || 'No description available.',
            genres: genres,
            releaseYear: releaseYear || 2000,
            rating: parseFloat(row.vote_average) || 0,
            language: row.original_language || 'en',
            popularity: parseFloat(row.popularity) || 0,
            cast: [], // movies.csv does not contain cast info
            director: '', // movies.csv does not contain director info
            posterUrl: tmdbPosterUrl || 'https://placehold.co/300x450/1f2937/ffffff?text=' + encodeURIComponent(row.title || 'No Poster'),
            trailerUrl: '',
          };
          moviesToInsert.push(movie);
        }
      })
      .on('end', async () => {
        console.log(`Parsed ${moviesToInsert.length} movies from CSV.`);
        console.log('Bulk inserting into MongoDB... This may take a moment.');
        try {
          await Movie.insertMany(moviesToInsert);
          console.log('All movies successfully imported!');
          process.exit(0);
        } catch (e) {
          console.error('Failed to import movies into database:', e);
          process.exit(1);
        }
      });
  } catch (error) {
    console.error('Mongoose Connection Error. Is your local MongoDB running on port 27017?', error.message);
    process.exit(1);
  }
}

importData();
