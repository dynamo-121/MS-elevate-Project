import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Heart, Trash2, Play } from 'lucide-react';

const Watchlist = () => {
  const { user, API_URL } = useContext(AuthContext);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        const config = {
          headers: {
            Authorization: `Bearer ${userInfo.token}`,
          },
        };
        const { data } = await axios.get(`${API_URL}/users/profile`, config);
        setWatchlist(data.watchlist || []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user, API_URL]);

  const removeFromWatchlist = async (movieId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.delete(`${API_URL}/users/watchlist/${movieId}`, config);
      // Optimistic update
      setWatchlist(watchlist.filter(m => m._id !== movieId));
    } catch (error) {
      console.error('Error removing from watchlist', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
      <div className="flex flex-col mb-8">
        <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
          <Heart className="text-primary w-8 h-8 fill-primary" />
          My Watchlist
        </h1>
        <p className="text-gray-300 text-lg">
          Movies you've saved to watch later.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center my-32">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
        </div>
      ) : !user ? (
        <div className="bg-gray-900/50 backdrop-blur-md p-8 border border-gray-800 rounded-xl text-center">
          <p className="text-red-400 text-lg">Please log in to view your Watchlist!</p>
          <Link to="/login" className="text-primary mt-4 inline-block hover:underline font-bold">Go to Login</Link>
        </div>
      ) : watchlist.length === 0 ? (
        <div className="bg-gray-900/50 backdrop-blur-md p-8 border border-gray-800 rounded-xl text-center">
          <p className="text-gray-300 text-lg">Your watchlist is currently empty. Go find some movies to add!</p>
          <Link to="/" className="text-primary mt-4 inline-block hover:underline font-bold">Browse Movies</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {watchlist.map((movie) => (
            <div
              key={movie._id}
              className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800 hover:border-primary/50 transition-all duration-300 group flex flex-col relative"
            >
              <div className="relative aspect-[2/3] overflow-hidden">
                <img
                  src={movie.posterUrl && !movie.posterUrl.includes('via.placeholder.com') ? movie.posterUrl : 'https://placehold.co/300x450/1f2937/ffffff?text=No+Poster'}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = 'https://placehold.co/300x450/1f2937/ffffff?text=No+Poster' }}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <Link to={`/movie/${movie._id}`} className="bg-primary text-white p-3 rounded-full hover:scale-110 transition-transform shadow-lg shadow-primary/30">
                    <Play className="h-8 w-8 ml-1 fill-white" />
                  </Link>
                </div>

                {/* Remove from Watchlist button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      removeFromWatchlist(movie._id);
                    }}
                    className="p-2 bg-red-600 rounded-lg hover:bg-red-700 shadow-lg transition"
                    title="Remove from Watchlist"
                  >
                    <Trash2 size={16} className="text-white" />
                  </button>
                </div>
              </div>

              <div className="p-4 flex flex-col flex-grow">
                <h3 className="font-bold text-base text-gray-100 line-clamp-1 mb-1" title={movie.title}>
                  {movie.title}
                </h3>
                <div className="flex items-center justify-between mt-auto pt-2 text-xs">
                  <span className="text-gray-400">{movie.releaseYear || 'N/A'}</span>
                  <span className="bg-gray-800 text-gray-300 px-2 py-1 rounded-md">
                    {movie.genres && movie.genres.length > 0 ? movie.genres[0] : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Watchlist;
