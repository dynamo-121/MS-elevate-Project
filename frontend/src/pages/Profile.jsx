import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Star, Clock, Heart, Trash2 } from 'lucide-react';

const Profile = () => {
  const { user, API_URL } = useContext(AuthContext);
  const [profileData, setProfileData] = useState(null);
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
        setProfileData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching profile', error);
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user, API_URL]);

  const removeFromWatchlist = async (movieId) => {
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.delete(`${API_URL}/users/watchlist/${movieId}`, config);
      // Optimistic update
      setProfileData({
        ...profileData,
        watchlist: profileData.watchlist.filter(m => m._id !== movieId)
      });
    } catch (error) {
      console.error('Error removing from watchlist', error);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Please login to view your profile</h2>
        <Link to="/login" className="text-primary mt-4 inline-block hover:underline">Go to Login</Link>
      </div>
    );
  }

  if (loading || !profileData) return <div className="text-center py-20">Loading profile...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="bg-black/40 backdrop-blur-lg rounded-xl p-8 mb-10 shadow-2xl border border-white/5">
        <h1 className="text-3xl font-bold mb-2">Welcome, {profileData.username}!</h1>
        <p className="text-gray-400">Email: {profileData.email}</p>
        <p className="text-gray-400">Role: <span className="uppercase text-primary font-semibold">{profileData.role}</span></p>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Heart className="text-primary" /> My Watchlist
        </h2>
        {profileData.watchlist.length === 0 ? (
          <p className="text-gray-400">Your watchlist is empty.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {profileData.watchlist.map((movie) => (
              <div key={movie._id} className="relative group flex flex-col items-center">
                <Link to={`/movie/${movie._id}`} className="w-full relative aspect-[2/3] overflow-hidden rounded-lg shadow-lg mb-3 block">
                  <img 
                    src={movie.posterUrl && !movie.posterUrl.includes('via.placeholder.com') ? movie.posterUrl : 'https://placehold.co/300x450/1f2937/ffffff?text=No+Poster'} 
                    alt={movie.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => removeFromWatchlist(movie._id)}
                    className="p-2 bg-red-600 rounded-full hover:bg-red-700 shadow-lg transition"
                    title="Remove from Watchlist"
                  >
                    <Trash2 size={16} className="text-white" />
                  </button>
                </div>
                <h3 className="text-sm font-semibold text-center truncate w-full">{movie.title}</h3>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Clock className="text-gray-300" /> Watch History
        </h2>
        {profileData.watchHistory.length === 0 ? (
          <p className="text-gray-400">You haven't watched any movies yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 opacity-75 hover:opacity-100 transition-opacity">
            {profileData.watchHistory.map((movie) => (
              <Link to={`/movie/${movie._id}`} key={movie._id} className="group">
                <img 
                  src={movie.posterUrl && !movie.posterUrl.includes('via.placeholder.com') ? movie.posterUrl : 'https://placehold.co/150x225/1f2937/ffffff?text=No+Poster'} 
                  alt={movie.title}
                  className="w-full aspect-[2/3] rounded shadow object-cover group-hover:ring-2 ring-primary transition"
                />
                <p className="text-xs text-center mt-2 truncate text-gray-400 group-hover:text-white">{movie.title}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
