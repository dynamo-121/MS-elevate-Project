import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Plus, Edit, Check } from 'lucide-react';

const AdminDashboard = () => {
  const { user, API_URL } = useContext(AuthContext);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [popupMessage, setPopupMessage] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [newMovie, setNewMovie] = useState({
    title: '',
    description: '',
    genres: '',
    releaseYear: '',
    posterUrl: '',
    rating: '',
    cast: '',
    director: ''
  });

  const fetchMovies = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/movies`);
      setMovies(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching movies', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, [API_URL]);

  const handleDeleteClick = (id) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };
      await axios.delete(`${API_URL}/movies/${confirmDeleteId}`, config);
      setMovies(movies.filter(m => m._id !== confirmDeleteId));
      setConfirmDeleteId(null);
      setPopupMessage("movie deleted successfully");
    } catch (error) {
      setConfirmDeleteId(null);
      setPopupMessage(error.response?.data?.message || 'Error deleting movie');
    }
  };

  const handleEdit = (movie) => {
    setEditingId(movie._id);
    setNewMovie({
      title: movie.title || '',
      description: movie.description || '',
      genres: movie.genres ? movie.genres.join(', ') : '',
      releaseYear: movie.releaseYear || '',
      posterUrl: movie.posterUrl && !movie.posterUrl.includes('via.placeholder.com') ? movie.posterUrl : '',
      rating: movie.rating || '',
      cast: movie.cast ? movie.cast.join(', ') : '',
      director: movie.director || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      const payload = {
        ...newMovie,
        genres: newMovie.genres.split(',').map(g => g.trim()).filter(Boolean),
        cast: newMovie.cast.split(',').map(c => c.trim()).filter(Boolean),
        releaseYear: parseInt(newMovie.releaseYear) || 2024,
        rating: parseFloat(newMovie.rating) || 0
      };

      if (editingId) {
        const { data } = await axios.put(`${API_URL}/movies/${editingId}`, payload, config);
        setMovies(movies.map(m => m._id === editingId ? data : m));
        setEditingId(null);
        setPopupMessage("update successfully");
      } else {
        const { data } = await axios.post(`${API_URL}/movies`, payload, config);
        setMovies([data, ...movies]);
        setPopupMessage("movie added successfully");
      }
      setNewMovie({ title: '', description: '', genres: '', releaseYear: '', posterUrl: '', rating: '', cast: '', director: '' });
    } catch (error) {
      setPopupMessage(error.response?.data?.message || 'Error saving movie');
    }
  };

  const handleSyncData = async () => {
    try {
      setIsSyncing(true);
      const userInfo = JSON.parse(localStorage.getItem('userInfo'));
      const config = { headers: { Authorization: `Bearer ${userInfo.token}` } };

      const { data } = await axios.post(`${API_URL}/movies/sync-csv`, {}, config);
      setPopupMessage(data.message || 'Movies synced successfully');
      fetchMovies(); // Refresh the list
    } catch (error) {
      setPopupMessage(error.response?.data?.message || 'Error syncing movies');
    } finally {
      setIsSyncing(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="text-center py-20 text-red-500 font-bold text-xl">Access Denied: Admins Only</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
      {popupMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full mx-4 opacity-100 scale-100 transition-all duration-300">
            <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-2">
              <Check size={32} />
            </div>
            <h3 className="text-xl font-bold text-white text-center capitalize">{popupMessage}</h3>
            <button onClick={() => setPopupMessage('')} className="mt-4 bg-primary hover:bg-red-700 w-full py-2 rounded font-bold text-white transition">OK</button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-700 p-8 rounded-xl shadow-2xl flex flex-col items-center gap-4 max-w-sm w-full mx-4 opacity-100 scale-100 transition-all duration-300">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-2">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-white text-center">Delete Movie?</h3>
            <p className="text-gray-400 text-center mb-2">This action cannot be undone.</p>
            <div className="flex gap-4 w-full">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded font-bold text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 py-2 rounded font-bold text-white transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-4xl font-bold mb-8 text-primary">Admin Dashboard</h1>

      {/* Add Movie Section */}
      <div className="bg-black/40 backdrop-blur-lg p-6 rounded-xl border border-white/10 mb-12 shadow-2xl">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          {editingId ? <><Edit className="text-primary" /> Edit Movie</> : <><Plus className="text-primary" /> Add New Movie</>}
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <input type="text" placeholder="Title" required className="bg-gray-800 border border-gray-700 rounded p-3 text-white focus:ring-primary focus:border-primary" value={newMovie.title} onChange={e => setNewMovie({ ...newMovie, title: e.target.value })} />
          <input type="number" placeholder="Release Year" required className="bg-gray-800 border border-gray-700 rounded p-3 text-white focus:ring-primary focus:border-primary" value={newMovie.releaseYear} onChange={e => setNewMovie({ ...newMovie, releaseYear: e.target.value })} />
          <input type="number" step="0.1" min="0" max="5" placeholder="Rating (0.0 to 10.0)" required className="bg-gray-800 border border-gray-700 rounded p-3 text-white focus:ring-primary focus:border-primary" value={newMovie.rating} onChange={e => setNewMovie({ ...newMovie, rating: e.target.value })} />
          <input type="text" placeholder="Director" className="bg-gray-800 border border-gray-700 rounded p-3 text-white focus:ring-primary focus:border-primary" value={newMovie.director} onChange={e => setNewMovie({ ...newMovie, director: e.target.value })} />
          <input type="text" placeholder="Cast (comma separated)" className="bg-gray-800 border border-gray-700 rounded p-3 text-white focus:ring-primary focus:border-primary" value={newMovie.cast} onChange={e => setNewMovie({ ...newMovie, cast: e.target.value })} />
          <input type="text" placeholder="Genres (comma separated)" className="bg-gray-800 border border-gray-700 rounded p-3 text-white focus:ring-primary focus:border-primary" value={newMovie.genres} onChange={e => setNewMovie({ ...newMovie, genres: e.target.value })} />
          <input type="url" placeholder="Poster URL" className="md:col-span-2 bg-gray-800 border border-gray-700 rounded p-3 text-white focus:ring-primary focus:border-primary" value={newMovie.posterUrl} onChange={e => setNewMovie({ ...newMovie, posterUrl: e.target.value })} />
          <textarea placeholder="Description" required className="md:col-span-2 bg-gray-800 border border-gray-700 rounded p-3 text-white h-24 focus:ring-primary focus:border-primary" value={newMovie.description} onChange={e => setNewMovie({ ...newMovie, description: e.target.value })}></textarea>
          <div className="md:col-span-2 flex gap-4">
            <button type="submit" className="bg-primary hover:bg-red-700 text-white font-bold py-3 px-6 rounded transition shadow-lg shrink-0">
              {editingId ? 'Update Movie' : 'Submit Movie'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setNewMovie({ title: '', description: '', genres: '', releaseYear: '', posterUrl: '', rating: '', cast: '', director: '' }); }}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded transition shadow-lg shrink-0"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Movie List Section */}
      <div className="bg-black/40 backdrop-blur-lg p-6 rounded-xl border border-white/10 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">Manage Movies</h2>
          <button
            onClick={handleSyncData}
            disabled={isSyncing}
            className={`bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition shadow-lg shrink-0 flex items-center gap-2 ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSyncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Syncing...
              </>
            ) : (
              'Sync Datasets from CSV'
            )}
          </button>
        </div>
        {loading ? <p>Loading movies...</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400">
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Director</th>
                  <th className="py-3 px-4">Year</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {movies.map(movie => (
                  <tr key={movie._id} className="border-b border-gray-800 hover:bg-white/5 transition">
                    <td className="py-3 px-4 font-medium">{movie.title}</td>
                    <td className="py-3 px-4 text-gray-500">{movie.director || '-'}</td>
                    <td className="py-3 px-4 text-gray-400">{movie.releaseYear}</td>
                    <td className="py-3 px-4 text-yellow-400 font-bold">{movie.rating ? movie.rating.toFixed(1) : '0.0'} ★</td>
                    <td className="py-3 px-4 flex gap-2">
                      <button onClick={() => handleEdit(movie)} className="text-blue-500 hover:text-blue-400 p-2 bg-blue-500/10 rounded transition" title="Edit Movie">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteClick(movie._id)} className="text-red-500 hover:text-red-400 p-2 bg-red-500/10 rounded transition" title="Delete Movie">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
