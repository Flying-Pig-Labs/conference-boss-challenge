import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ChallengePage from './pages/ChallengePage';
import LeaderboardPage from './pages/LeaderboardPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Header Navigation */}
        <header className="bg-white shadow-md">
          <nav className="container mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-blue-600">
                🎤 Conference Boss Challenge
              </h1>
              <div className="flex gap-4">
                <Link
                  to="/"
                  className="text-gray-700 hover:text-blue-600 font-semibold transition px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  Challenge
                </Link>
                <Link
                  to="/leaderboard"
                  className="text-gray-700 hover:text-blue-600 font-semibold transition px-4 py-2 rounded-lg hover:bg-blue-50"
                >
                  Leaderboard
                </Link>
              </div>
            </div>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-6 py-8">
          <Routes>
            <Route path="/" element={<ChallengePage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="container mx-auto px-6 text-center text-gray-600 text-sm">
            <p>Conference Boss Challenge © 2025 | Have fun and be honest!</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
