const Movie = require('../models/Movie');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');// @desc    Fetch all movies (with search, filter, sort)
// @route   GET /api/movies
// @access  Public
const getMovies = async (req, res) => {
  try {
    // 1. Search by title, actor, or genre
    const keyword = req.query.keyword
      ? {
          $or: [
            { title: { $regex: req.query.keyword, $options: 'i' } },
            { cast: { $regex: req.query.keyword, $options: 'i' } },
            { genres: { $regex: req.query.keyword, $options: 'i' } },
          ],
        }
      : {};

    // 2. Filter by genre, year, rating, language
    const filter = {};
    if (req.query.genre) filter.genres = req.query.genre;
    if (req.query.year) filter.releaseYear = req.query.year;
    if (req.query.rating) filter.rating = { $gte: Number(req.query.rating) };
    if (req.query.language) filter.language = req.query.language;

    // 3. Sort by popularity, latest, ratings
    let sort = {};
    if (req.query.sort === 'latest') sort = { releaseYear: -1, _id: -1 };
    else if (req.query.sort === 'rating') sort = { rating: -1, _id: -1 };
    else sort = { popularity: -1, _id: -1 }; // Default to popularity desc, tie-breaker _id desc

    const baseQuery = { ...keyword, ...filter };

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 50; // default 50 items per query
    const skip = (page - 1) * limit;

    const movies = await Movie.find(baseQuery)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch single movie
// @route   GET /api/movies/:id
// @access  Public
const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (movie) {
      res.json(movie);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a movie
// @route   POST /api/movies
// @access  Private/Admin
const createMovie = async (req, res) => {
  try {
    const movieData = { ...req.body };
    if (movieData.popularity === undefined) movieData.popularity = 1000;
    const movie = new Movie(movieData);
    const createdMovie = await movie.save();
    res.status(201).json(createdMovie);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a movie
// @route   PUT /api/movies/:id
// @access  Private/Admin
const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (movie) {
      Object.assign(movie, req.body);
      const updatedMovie = await movie.save();
      res.json(updatedMovie);
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a movie
// @route   DELETE /api/movies/:id
// @access  Private/Admin
const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (movie) {
      await movie.deleteOne();
      res.json({ message: 'Movie removed' });
    } else {
      res.status(404).json({ message: 'Movie not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const syncMoviesFromCSV = async (req, res) => {
  try {
    const dataDir = path.join(__dirname, '..', 'data');
    const moviesFile = path.join(dataDir, 'movies.csv');

    if (!fs.existsSync(moviesFile)) {
      return res.status(404).json({ message: 'movies.csv not found in backend/data directory.' });
    }

    const moviesToInsert = [];

    // Parse movies and insert
    await new Promise((resolve, reject) => {
      fs.createReadStream(moviesFile)
        .pipe(csv())
        .on('data', (row) => {
          try {
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
              
              moviesToInsert.push({
                title: row.title,
                description: row.overview || 'No description available.',
                genres: genres,
                releaseYear: releaseYear || 2000,
                rating: parseFloat(row.vote_average) || 0,
                language: row.original_language || 'en',
                popularity: parseFloat(row.popularity) || 0,
                cast: [],
                director: '',
                posterUrl: tmdbPosterUrl || 'https://placehold.co/300x450/1f2937/ffffff?text=' + encodeURIComponent(row.title),
                trailerUrl: '',
              });
            }
          } catch (e) {
            // Ignore parse errors for single rows
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Clear existing movies and insert new ones
    await Movie.deleteMany({});
    
    // Insert in batches of 500 to prevent overwhelming memory/MongoDB
    const batchSize = 500;
    for (let i = 0; i < moviesToInsert.length; i += batchSize) {
      const batch = moviesToInsert.slice(i, i + batchSize);
      await Movie.insertMany(batch);
    }

    res.json({ message: `Successfully synced ${moviesToInsert.length} movies from movies.csv!` });
  } catch (error) {
    console.error('Error syncing movies:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
  syncMoviesFromCSV,
};
