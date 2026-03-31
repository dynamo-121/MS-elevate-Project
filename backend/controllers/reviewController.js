const Review = require('../models/Review');
const Movie = require('../models/Movie');

// @desc    Add a new review for a movie
// @route   POST /api/reviews/:movieId
// @access  Private
const addReview = async (req, res) => {
  const { rating, comment } = req.body;
  const { movieId } = req.params;

  try {
    const movie = await Movie.findById(movieId);

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Check if user already reviewed this movie
    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      movie: movieId,
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Movie already reviewed' });
    }

    const review = await Review.create({
      user: req.user._id,
      movie: movieId,
      rating: Number(rating),
      comment,
    });

    // Update movie rating and numReviews
    const allReviews = await Review.find({ movie: movieId });
    movie.numReviews = allReviews.length;
    movie.rating = allReviews.reduce((acc, item) => item.rating + acc, 0) / allReviews.length;
    
    await movie.save();

    res.status(201).json({ message: 'Review added' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all reviews for a movie
// @route   GET /api/reviews/:movieId
// @access  Public
const getMovieReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ movie: req.params.movieId }).populate(
      'user',
      'username'
    );
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addReview, getMovieReviews };
