import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import MovieDetails from './pages/MovieDetails';
import AIAssistant from './pages/AIAssistant';
import AdminDashboard from './pages/AdminDashboard';
import TopPicks from './pages/TopPicks';
import Watchlist from './pages/Watchlist';
import Onboarding from './pages/Onboarding';
import InteractiveBackground from './components/InteractiveBackground';

function App() {
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  return (
    <Router>
      <div className="min-h-screen relative flex flex-col text-white overflow-hidden">
        <InteractiveBackground />
        <Navbar toggleAssistant={() => setIsAIAssistantOpen(!isAIAssistantOpen)} />
        <AIAssistant isOpen={isAIAssistantOpen} onClose={() => setIsAIAssistantOpen(false)} />
        <main className="flex-grow pt-16 relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/top-picks" element={<TopPicks />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/onboarding" element={<Onboarding />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
