import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Star, Plus, Check } from 'lucide-react';

const MovieDetails = () => {
  const { id } = useParams();
  const { user, API_URL } = useContext(AuthContext);
  const [movie, setMovie] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [reviewMessage, setReviewMessage] = useState({ type: '', text: '' });
  const [similarMovies, setSimilarMovies] = useState([]);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/movies/${id}`);
        setMovie(data);

        const reviewsRes = await axios.get(`${API_URL}/reviews/${id}`);
        setReviews(reviewsRes.data);

        // Check if in watchlist
        if (user) {
          const userInfo = JSON.parse(localStorage.getItem('userInfo'));
          const profileRes = await axios.get(`${API_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          });
          const hasMovie = profileRes.data.watchlist.some(m => m._id === id);
          setInWatchlist(hasMovie);

          // Add to watch history
          await axios.post(`${API_URL}/users/history/${id}`, {}, {
            headers: { Authorization: `Bearer ${userInfo.token}` },
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching details', error);
        setLoading(false);
      }
    };
    fetchMovieDetails();

    // Fetch recommendations from python microservice
    axios.get(`http://localhost:8000/recommend/${id}`).then(res => {
      if (res.data.recommendations) {
        setSimilarMovies(res.data.recommendations);
      }
    }).catch(err => console.error('Recommendation service not reachable yet', err));

  }, [id, user, API_URL]);

  const handleWatchlistToggle = async () => {
    if (!user) return alert('Please login first');
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      if (inWatchlist) {
        await axios.delete(`${API_URL}/users/watchlist/${id}`, config);
      } else {
        await axios.post(`${API_URL}/users/watchlist/${id}`, {}, config);
      }
      setInWatchlist(!inWatchlist);
    } catch (error) {
      console.error('Watchlist toggle failed', error);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      setReviewMessage({ type: 'error', text: 'Please login first' });
      setTimeout(() => setReviewMessage({ type: '', text: '' }), 3000);
      return;
    }
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      
      await axios.post(`${API_URL}/reviews/${id}`, newReview, config);
      
      // Refresh reviews
      const reviewsRes = await axios.get(`${API_URL}/reviews/${id}`);
      setReviews(reviewsRes.data);
      setNewReview({ rating: 5, comment: '' });
      setReviewMessage({ type: 'success', text: 'Review added successfully' });
      setTimeout(() => setReviewMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      setReviewMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add review' });
      setTimeout(() => setReviewMessage({ type: '', text: '' }), 3000);
    }
  };

  if (loading) return <div className="text-center py-20">Loading movie details...</div>;
  if (!movie) return <div className="text-center py-20 text-red-500 font-semibold text-xl">Movie not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Section */}
      <div className="flex flex-col md:flex-row gap-10 bg-black/40 backdrop-blur-lg rounded-xl overflow-hidden shadow-2xl p-6 border border-white/5">
        <div className="md:w-1/3 flex-shrink-0">
          <img 
            src={movie.posterUrl && !movie.posterUrl.includes('via.placeholder.com') ? movie.posterUrl : 'https://placehold.co/400x600/1f2937/ffffff?text=No+Poster'} 
            alt={movie.title} 
            className="w-full h-auto rounded-lg shadow-xl"
          />
        </div>
        <div className="md:w-2/3 flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">{movie.title} <span className="text-xl text-gray-400 font-normal">({movie.releaseYear})</span></h1>
          
          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-2 bg-gray-800 px-3 py-1 rounded-full text-sm">
              <Star className="text-yellow-400" size={18} />
              <span className="font-bold">{movie.rating.toFixed(1)} <span className="text-gray-400 font-normal">/ 10</span></span>
              <span className="text-gray-400">({movie.numReviews} reviews)</span>
            </div>
            <div className="text-sm text-gray-300">
              {movie.genres?.join(', ')} • {movie.language}
            </div>
          </div>

          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            {movie.description || 'No description available for this movie yet.'}
          </p>

          {(movie.director || (movie.cast && movie.cast.length > 0)) && (
            <div className="grid grid-cols-2 gap-4 mb-8">
              {movie.director && (
                <div>
                  <p className="text-gray-400 text-sm">Director</p>
                  <p className="font-medium">{movie.director}</p>
                </div>
              )}
              {movie.cast && movie.cast.length > 0 && (
                <div>
                  <p className="text-gray-400 text-sm">Cast</p>
                  <p className="font-medium">{movie.cast.join(', ')}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 mt-auto">
            {movie.trailerUrl && (
              <a 
                href={movie.trailerUrl} 
                target="_blank" 
                rel="noreferrer"
                className="bg-primary hover:bg-red-700 text-white px-6 py-3 rounded-md font-bold transition shadow-lg flex-1 text-center"
              >
                Watch Trailer
              </a>
            )}
            <button 
              onClick={handleWatchlistToggle}
              className={`px-6 py-3 rounded-md font-bold transition shadow-lg flex items-center justify-center gap-2 flex-1 border ${inWatchlist ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white text-black border-white hover:bg-gray-200'}`}
            >
              {inWatchlist ? <><Check size={20}/> In Watchlist</> : <><Plus size={20}/> Add to Watchlist</>}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-16">
        <h2 className="text-3xl font-bold mb-8">Reviews</h2>
        
        {reviewMessage.text && (
          <div className={`mb-6 p-4 rounded-md text-white font-medium shadow-md transition-all ${reviewMessage.type === 'success' ? 'bg-green-600/20 border border-green-500 text-green-400' : 'bg-red-600/20 border border-red-500 text-red-400'}`}>
            {reviewMessage.text}
          </div>
        )}

        {user && (
          <form onSubmit={submitReview} className="bg-black/40 backdrop-blur-lg p-6 rounded-xl border border-white/5 mb-8">
            <h3 className="text-lg font-semibold mb-4 text-primary">Write a Review</h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <label className="text-gray-300">Rating:</label>
                <select 
                  className="bg-gray-800 border border-gray-700 rounded p-2 text-white focus:ring-primary focus:border-primary"
                  value={newReview.rating} 
                  onChange={(e) => setNewReview({...newReview, rating: e.target.value})}
                >
                  <option value="10">10 - Masterpiece</option>
                  <option value="9">9 - Incredible</option>
                  <option value="8">8 - Excellent</option>
                  <option value="7">7 - Very Good</option>
                  <option value="6">6 - Good</option>
                  <option value="5">5 - Average</option>
                  <option value="4">4 - Below Average</option>
                  <option value="3">3 - Poor</option>
                  <option value="2">2 - Bad</option>
                  <option value="1">1 - Terrible</option>
                </select>
              </div>
              <textarea 
                required
                className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-white h-24 focus:ring-primary focus:border-primary focus:outline-none"
                placeholder="Share your thoughts about this movie..."
                value={newReview.comment}
                onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
              />
              <button 
                type="submit" 
                className="self-start bg-primary hover:bg-red-700 px-6 py-2 rounded-md font-medium text-white transition"
              >
                Submit Review
              </button>
            </div>
          </form>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-gray-400">No reviews yet. Be the first to review!</p>
          ) : (
            reviews.map(review => (
              <div key={review._id} className="bg-black/30 backdrop-blur-md p-6 rounded-xl border border-white/5 shadow-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-primary font-bold text-lg">
                      {review.user?.username ? review.user.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{review.user?.username || 'Unknown User'}</h4>
                      <p className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-900 px-2 py-1 rounded text-yellow-400 font-bold">
                    <Star size={14} className="fill-yellow-400" />
                    {review.rating}/10
                  </div>
                </div>
                <p className="text-gray-300 mt-3 whitespace-pre-line">{review.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Similar Movies Section */}
      {similarMovies.length > 0 && (
        <div className="mt-16 border-t border-white/10 pt-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-2">
            <Star className="text-yellow-400" /> Similar Movies
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {similarMovies.map((simMovie) => (
              <a href={`/movie/${simMovie._id}`} key={simMovie._id} className="group flex flex-col items-center">
                <div className="relative w-full aspect-[2/3] overflow-hidden rounded-lg shadow-lg mb-3">
                  <img 
                    src={simMovie.posterUrl && !simMovie.posterUrl.includes('via.placeholder.com') ? simMovie.posterUrl : 'https://placehold.co/300x450/1f2937/ffffff?text=No+Poster'} 
                    alt={simMovie.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-semibold">View Details</span>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-center truncate w-full group-hover:text-primary transition-colors">
                  {simMovie.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                  <Star size={12} className="text-yellow-400" />
                  <span>{simMovie.rating ? simMovie.rating.toFixed(1) : 'N/A'} <span className="text-[10px]">/10</span></span>
                  <span className="ml-2">{simMovie.releaseYear || ''}</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieDetails;
