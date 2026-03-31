const express = require('express');
const router = express.Router();
const { addReview, getMovieReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

router.route('/:movieId')
  .post(protect, addReview)
  .get(getMovieReviews);

module.exports = router;
