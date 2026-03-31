const User = require('../models/User');
const Movie = require('../models/Movie');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('watchlist')
      .populate('watchHistory');
    
    if (user) {
      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        preferredGenres: user.preferredGenres || [],
        watchlist: user.watchlist,
        watchHistory: user.watchHistory,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add movie to watchlist
// @route   POST /api/users/watchlist/:movieId
// @access  Private
const addToWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const movie = await Movie.findById(req.params.movieId);

    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    if (!user.watchlist.includes(movie._id)) {
      user.watchlist.push(movie._id);
      await user.save();
    }

    res.json(user.watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove from watchlist
// @route   DELETE /api/users/watchlist/:movieId
// @access  Private
const removeFromWatchlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    user.watchlist = user.watchlist.filter(
      (id) => id.toString() !== req.params.movieId.toString()
    );

    await user.save();
    res.json(user.watchlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add movie to watch history
// @route   POST /api/users/history/:movieId
// @access  Private
const addToWatchHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const movie = await Movie.findById(req.params.movieId);

    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    if (!user.watchHistory.includes(movie._id)) {
      user.watchHistory.push(movie._id);
      await user.save();
    }

    res.json(user.watchHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updatePreferences = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.preferredGenres = req.body.preferredGenres || user.preferredGenres;
      const updatedUser = await user.save();
      
      res.json({
        _id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        preferredGenres: updatedUser.preferredGenres,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserProfile,
  addToWatchlist,
  removeFromWatchlist,
  addToWatchHistory,
  updatePreferences,
};
