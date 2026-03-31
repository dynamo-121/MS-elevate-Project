import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import { Star } from 'lucide-react';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { API_URL, user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('keyword');
  const genre = searchParams.get('genre');
  const year = searchParams.get('year');
  const rating = searchParams.get('rating');
  const sort = searchParams.get('sort') || 'popularity';

  // Local state for the filter dropdowns
  const [localGenre, setLocalGenre] = useState(genre || '');
  const [localYear, setLocalYear] = useState(year || '');
  const [localRating, setLocalRating] = useState(rating || '');
  const [localSort, setLocalSort] = useState(sort);

  // Keep local state in sync if URL changes outside (e.g., via browser navigation)
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [keyword, genre, year, rating, sort]);

  useEffect(() => {
    setLocalGenre(genre || '');
    setLocalYear(year || '');
    setLocalRating(rating || '');
    setLocalSort(sort || 'popularity');
  }, [genre, year, rating, sort]);

  const handleApplyFilters = () => {
    const newParams = new URLSearchParams();
    if (keyword) newParams.append('keyword', keyword); // Preserve search across filters
    if (localGenre) newParams.append('genre', localGenre);
    if (localYear) newParams.append('year', localYear);
    if (localRating) newParams.append('rating', localRating);
    if (localSort && localSort !== 'popularity') newParams.append('sort', localSort);
    setSearchParams(newParams);
  };

  useEffect(() => {
    const fetchMovies = async () => {
      if (page === 1) setLoading(true);
      else setLoadingMore(true);
      
      try {
        // If user has set personalized genres, and hasn't explicitly applied manual filters 
        if (
          user && 
          user.preferredGenres && 
          user.preferredGenres.length > 0 && 
          !keyword && !genre && !year && !rating && (sort === 'popularity' || !sort)
        ) {
          if (page === 1) {
            const { data } = await axios.get(`http://localhost:8000/home-feed/${user._id}`);
            setMovies(data.feed || []);
            setHasMore(false); // Deep learning feed currently returns a fixed top 50
          } else {
            setHasMore(false);
          }
        } else {
          // Standard Fetch Feed
          const params = new URLSearchParams();
          if (keyword) params.append('keyword', keyword);
          if (genre) params.append('genre', genre);
          if (year) params.append('year', year);
          if (rating) params.append('rating', rating);
          if (sort) params.append('sort', sort);
          params.append('page', page);

          const url = `${API_URL}/movies?${params.toString()}`;
          const { data } = await axios.get(url);
          
          if (page === 1) {
            setMovies(data);
          } else {
            setMovies(prev => [...prev, ...data]);
          }
          
          setHasMore(data.length === 50);
        }

        setLoading(false);
        setLoadingMore(false);
      } catch (error) {
        console.error('Error fetching movies', error);
        setLoading(false);
        setLoadingMore(false);
      }
    };
    fetchMovies();
  }, [API_URL, keyword, genre, year, rating, sort, page, user]);

  if (loading) return <div className="text-center py-20 text-xl text-gray-400">Loading movies...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Hero Section Placeholder */}
      <div className="relative w-full h-96 bg-black/40 backdrop-blur-lg rounded-xl mb-12 overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-t from-secondary via-transparent to-transparent z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2000&auto=format&fit=crop"
          alt="Featured Movie"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute bottom-10 left-10 z-20 max-w-2xl">
          <h1 className="text-5xl font-extrabold text-white mb-4 drop-shadow-md">
            Explore the Best Movies
          </h1>
          <p className="text-lg text-gray-300 line-clamp-2 mb-6">
            Discover a vast collection of critically acclaimed movies. Dive into a world of entertainment with our top picks.
          </p>
          {/* <button className="bg-primary hover:bg-red-700 text-white px-8 py-3 rounded-md font-bold text-lg transition duration-200">
            Play Now
          </button> */}
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-lg p-4 rounded-xl mb-8 border border-white/5 flex flex-wrap gap-4 items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
        <div className="flex flex-wrap gap-4 items-center">
          <select 
            value={localGenre} 
            onChange={(e) => setLocalGenre(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:border-primary"
          >
            <option value="">All Genres</option>
            <option value="Action">Action</option>
            <option value="Fantasy">Fantasy</option>
            <option value="Drama">Drama</option>
            <option value="Comedy">Comedy</option>
            <option value="Thriller">Thriller</option>
            <option value="Crime">Crime</option>
            <option value="Adventure">Adventure</option>
            <option value="Horror">Horror</option>
          </select>

          <select 
            value={localYear} 
            onChange={(e) => setLocalYear(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:border-primary"
          >
            <option value="">Any Year</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2019">2019</option>
            <option value="2014">2014</option>
            <option value="2010">2010</option>
            <option value="2008">2008</option>
          </select>

          <select 
            value={localRating} 
            onChange={(e) => setLocalRating(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:border-primary"
          >
            <option value="">Any Rating</option>
            <option value="9">9+ Stars</option>
            <option value="8">8+ Stars</option>
            <option value="7">7+ Stars</option>
            <option value="6">6+ Stars</option>
            <option value="5">5+ Stars</option>
          </select>

          <button
            onClick={handleApplyFilters}
            className="bg-primary hover:bg-red-700 text-white px-6 py-2 rounded-md font-semibold transition-colors duration-200 whitespace-nowrap"
          >
            Apply
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Sort by:</span>
          <select 
            value={localSort} 
            onChange={(e) => setLocalSort(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-md py-2 px-3 text-white focus:outline-none focus:border-primary"
          >
            <option value="popularity">Popularity</option>
            <option value="latest">Latest</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Star className="text-yellow-400" />
        {keyword ? `Search Results for "${keyword}"` : 'Trending Now'}
      </h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {movies.map((movie) => (
          <Link to={`/movie/${movie._id}`} key={movie._id} className="group flex flex-col items-center">
            <div className="relative w-full aspect-[2/3] overflow-hidden rounded-lg shadow-lg mb-3">
              <img 
                src={movie.posterUrl && !movie.posterUrl.includes('via.placeholder.com') ? movie.posterUrl : 'https://placehold.co/300x450/1f2937/ffffff?text=No+Poster'} 
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white font-semibold">View Details</span>
              </div>
              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-yellow-500 flex items-center gap-1 border border-white/10 shadow-lg">
                <Star size={12} className="fill-yellow-500" />
                {movie.rating ? movie.rating.toFixed(1) : 'N/A'} <span className="text-[10px] text-gray-400 font-normal">/10</span>
              </div>
            </div>
            <h3 className="text-sm font-semibold text-center truncate w-full group-hover:text-primary transition-colors">
              {movie.title}
            </h3>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
              <Star size={12} className="text-yellow-400" />
              <span>{movie.rating ? movie.rating.toFixed(1) : 'N/A'}</span>
              <span className="ml-2">{movie.releaseYear}</span>
            </div>
          </Link>
        ))}
        {movies.length === 0 && <p className="col-span-full text-gray-400">No movies found.</p>}
      </div>

      {movies.length > 0 && hasMore && (
        <div className="flex justify-center mt-12 mb-8">
          <button
            onClick={() => setPage(prev => prev + 1)}
            disabled={loadingMore}
            className={`bg-primary hover:bg-red-700 text-white px-8 py-3 rounded-md font-bold text-lg transition duration-200 shadow-lg ${loadingMore ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Home;
