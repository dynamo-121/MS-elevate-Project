const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  addToWatchlist,
  removeFromWatchlist,
  addToWatchHistory,
  updatePreferences,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.route('/profile').get(protect, getUserProfile);
router.route('/preferences').put(protect, updatePreferences);
router.route('/watchlist/:movieId')
  .post(protect, addToWatchlist)
  .delete(protect, removeFromWatchlist);
router.route('/history/:movieId')
  .post(protect, addToWatchHistory);

module.exports = router;
