import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Film } from 'lucide-react';

const GENRES = [
  "Action", "Adventure", "Animation", "Comedy", "Crime", 
  "Documentary", "Drama", "Family", "Fantasy", "History", 
  "Horror", "Music", "Mystery", "Romance", "Science Fiction", 
  "Thriller", "War", "Western"
];

const Onboarding = () => {
  const { user, updateUser, API_URL } = useContext(AuthContext);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if they aren't logged in, or if they already set genres
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user.preferredGenres && user.preferredGenres.length > 0) {
      navigate('/');
    }
  }, [user, navigate]);

  const toggleGenre = (genre) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(prev => prev.filter(g => g !== genre));
    } else {
      setSelectedGenres(prev => [...prev, genre]);
    }
  };

  const handleSubmit = async () => {
    if (selectedGenres.length === 0) return;
    setLoading(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${user.token}` }
      };
      
      const { data } = await axios.put(`${API_URL}/users/preferences`, {
        preferredGenres: selectedGenres
      }, config);
      
      // Update local context safely preserving the token
      updateUser({ ...data, token: user.token });
      
      // Navigate to personalized feed!
      navigate('/');
    } catch (error) {
      console.error('Failed to save preferences', error);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="max-w-3xl w-full bg-gray-900/60 backdrop-blur-md p-10 rounded-2xl shadow-2xl border border-gray-800">
        <Film className="w-16 h-16 mx-auto mb-6 text-primary" />
        <h1 className="text-4xl font-extrabold mb-4">What do you like to watch?</h1>
        <p className="text-gray-400 mb-8 text-lg">Pick a few genres so we can tailor the homepage perfectly for you.</p>

        <div className="flex flex-wrap gap-4 justify-center mb-10">
          {GENRES.map((genre) => {
            const isSelected = selectedGenres.includes(genre);
            return (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`px-6 py-3 rounded-full border-2 font-semibold transition-all duration-300 transform shadow-md ${
                  isSelected 
                    ? 'bg-primary border-primary text-white scale-105 shadow-primary/40' 
                    : 'bg-transparent border-gray-600 text-gray-300 hover:border-gray-400 hover:bg-gray-800'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSubmit}
          disabled={selectedGenres.length === 0 || loading}
          className={`w-full sm:w-auto px-10 py-4 text-xl font-bold rounded-xl transition duration-300 shadow-xl ${
            selectedGenres.length > 0
              ? 'bg-white text-black hover:bg-gray-200'
              : 'bg-gray-800 text-gray-400 cursor-not-allowed hidden'
          }`}
        >
          {loading ? 'Personalizing Feed...' : "Start Watching"}
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
