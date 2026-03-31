import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Play, Star } from 'lucide-react';

const TopPicks = () => {
  const { user } = useContext(AuthContext);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopPicks = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const response = await axios.get(`http://localhost:8000/top-picks/${user._id}`);
        setMovies(response.data.recommendations || []);
      } catch (error) {
        console.error("Error fetching top picks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopPicks();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-white">
      <div className="flex flex-col mb-8">
        <h1 className="text-4xl font-extrabold text-white mb-2 flex items-center gap-3">
          <Star className="text-primary w-8 h-8 fill-primary" />
          Top Picks for You
        </h1>
        <p className="text-gray-300 text-lg">
          Personalized recommendations predicting what you'll love!
        </p>
      </div>
      
      {loading ? (
        <div className="flex flex-col items-center justify-center my-32">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
          <p className="text-primary font-medium animate-pulse">Top Picks for you...</p>
        </div>
      ) : !user ? (
         <div className="bg-gray-900/50 backdrop-blur-md p-8 border border-gray-800 rounded-xl text-center">
            <p className="text-red-400 text-lg">Please log in to receive personalized Top Picks!</p>
         </div>
      ) : movies.length === 0 ? (
         <div className="bg-gray-900/50 backdrop-blur-md p-8 border border-gray-800 rounded-xl text-center">
            <p className="text-red-400 text-lg">Not enough data to generate recommendations. Try reviewing some movies first!</p>
         </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {movies.map((movie) => (
            <div 
              key={movie._id} 
              className="bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800 hover:border-primary/50 transition-all duration-300 group flex flex-col relative"
            >
              <div className="relative aspect-[2/3] overflow-hidden">
                <img 
                  src={movie.posterUrl} 
                  alt={movie.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = 'https://placehold.co/300x450/1f2937/ffffff?text=No+Poster' }}
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button className="bg-primary text-white p-3 rounded-full hover:scale-110 transition-transform shadow-lg shadow-primary/30">
                    <Play className="h-8 w-8 ml-1 fill-white" />
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
                    {movie.genre}
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

export default TopPicks;
