import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Search, User, LogOut, Clock, X, Bot } from 'lucide-react';
import axios from 'axios';

const Navbar = ({ toggleAssistant }) => {
  const { user, logout, API_URL } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const dropdownRef = useRef(null);

  const searchKey = user ? `recentSearches_${user._id}` : 'recentSearches_guest';

  useEffect(() => {
    const saved = localStorage.getItem(searchKey);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse recent searches", e);
        setRecentSearches([]);
      }
    } else {
      setRecentSearches([]);
    }
  }, [searchKey]);

  const saveRecentSearch = (movie) => {
    // Only save if there's a valid movie ID (prevent React rendering errors on empty searches)
    if (!movie || !movie._id) return;
    
    const updated = [movie, ...recentSearches.filter(m => m._id !== movie._id)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem(searchKey, JSON.stringify(updated));
  };

  const clearRecentSearches = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem(searchKey);
  };

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        return;
      }
      try {
        const { data } = await axios.get(`${API_URL}/movies?keyword=${encodeURIComponent(searchQuery)}`);
        setSearchResults(data.slice(0, 5));
        setIsDropdownOpen(true);
      } catch (error) {
        console.error('Error fetching search results', error);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSearchResults();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, API_URL]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setIsDropdownOpen(false);
    if (searchQuery.trim()) {
      navigate(`/?keyword=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/');
    }
  };

  return (
    <nav className="fixed w-full z-50 bg-black/30 backdrop-blur-xl border-b border-white/5 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2">
            <img src="/logo.jpeg" alt="Netflixo Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(229,9,20,0.6)] hover:scale-105 transition-transform" />
            <span className="text-primary text-2xl font-bold tracking-wider">NETFLIXO</span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-lg px-8 hidden md:block">
            <div className="relative" ref={dropdownRef}>
              <form onSubmit={handleSearch} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (searchQuery.trim().length > 0 || recentSearches.length > 0) {
                      setIsDropdownOpen(true);
                    }
                  }}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md leading-5 bg-gray-900 text-gray-300 placeholder-gray-400 focus:outline-none focus:bg-white focus:text-gray-900 focus:border-white sm:text-sm transition duration-150 ease-in-out"
                  placeholder="Search movies, TV shows, and more..."
                />
              </form>

              {/* Search Dropdown */}
              {isDropdownOpen && (searchResults.length > 0 || (searchQuery.trim().length === 0 && recentSearches.length > 0)) && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-md shadow-xl overflow-hidden z-50">
                  
                  {searchQuery.trim().length === 0 && recentSearches.length > 0 && (
                    <div className="px-4 py-2 border-b border-gray-800 flex justify-between items-center text-xs text-gray-400 font-semibold uppercase tracking-wider bg-gray-800/50">
                      <span className="flex items-center gap-1"><Clock size={12} /> Recent Searches</span>
                      <button onClick={clearRecentSearches} className="hover:text-white transition-colors flex items-center gap-1 py-1">
                        <X size={12} /> Clear
                      </button>
                    </div>
                  )}

                  <ul className="max-h-96 overflow-y-auto">
                    {(searchQuery.trim().length === 0 ? recentSearches : searchResults).map((movie) => (
                      <li key={movie._id}>
                        <Link
                          to={`/movie/${movie._id}`}
                          onClick={() => {
                            saveRecentSearch(movie);
                            setIsDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors cursor-pointer border-b border-gray-800 last:border-0"
                        >
                          <img 
                            src={movie.posterUrl || 'https://via.placeholder.com/40x60?text=No+Poster'} 
                            alt={movie.title}
                            className="w-10 h-14 object-cover rounded mr-4"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {movie.title}
                            </p>
                            <p className="text-xs text-gray-400 truncate">
                              {movie.releaseYear || 'N/A'} • {movie.genres?.join(', ')}
                            </p>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* User actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <button 
                  onClick={toggleAssistant} 
                  className="flex items-center gap-2 px-4 py-2 mr-2 rounded-full font-bold text-white bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 transform transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
                >
                  <Bot size={18} className="animate-bounce" style={{ animationDuration: '2.5s' }} />
                  <span className="hidden sm:block text-sm">✨ AI Assistant</span>
                </button>
                {user.role === 'admin' && (
                  <Link to="/admin" className="bg-primary/20 text-primary border border-primary/50 hover:bg-primary/40 px-3 py-1 rounded transition duration-150 font-semibold text-sm mr-2 hidden sm:block">
                    Admin
                  </Link>
                )}
                <Link to="/top-picks" className="bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:text-white px-3 py-1 rounded transition duration-150 font-semibold text-sm mr-2 hidden sm:block">
                  Top Picks
                </Link>
                <Link to="/watchlist" className="bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:text-white px-3 py-1 rounded transition duration-150 font-semibold text-sm mr-2 hidden sm:block">
                  Watchlist
                </Link>
                <Link to="/profile" className="text-gray-300 hover:text-white flex items-center gap-2 transition duration-150">
                  <User size={20} />
                  <span className="hidden sm:block">{user.username}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-300 hover:text-primary transition duration-150"
                  title="Logout"
                >
                  <LogOut size={20} />
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={toggleAssistant} 
                  className="flex items-center gap-2 px-4 py-2 mr-2 rounded-full font-bold text-white bg-gradient-to-r from-red-600 to-purple-600 hover:from-red-500 hover:to-purple-500 transform transition-all duration-300 hover:scale-105 shadow-[0_0_15px_rgba(239,68,68,0.5)] hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]"
                >
                  <Bot size={18} className="animate-bounce" style={{ animationDuration: '2.5s' }} />
                  <span className="hidden sm:block text-sm">✨ AI Assistant</span>
                </button>
                <Link to="/login" className="text-gray-300 hover:text-white transition duration-150">
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-primary hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition duration-150 shadow-lg"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
