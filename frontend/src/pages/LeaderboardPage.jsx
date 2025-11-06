import React from 'react';

/**
 * Leaderboard Page
 *
 * Displays all participants sorted by score
 * - Top 3 highlighted
 * - Real-time updates via polling
 * - Shows rank, name, score, timestamp
 *
 * This is a placeholder - full implementation in Phase 2
 */
function LeaderboardPage() {
  // Mock data for Phase 0
  const mockLeaderboard = [
    { rank: 1, name: 'Sarah Chen', score: 95, timestamp: '2025-11-06T10:30:00Z' },
    { rank: 2, name: 'Mike Rodriguez', score: 87, timestamp: '2025-11-06T10:35:00Z' },
    { rank: 3, name: 'Emily Johnson', score: 82, timestamp: '2025-11-06T10:28:00Z' },
  ];

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return rank;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'bg-yellow-100 border-yellow-300';
    if (rank === 2) return 'bg-gray-100 border-gray-300';
    if (rank === 3) return 'bg-orange-100 border-orange-300';
    return 'bg-white border-gray-200';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-2">
            🏆 Leaderboard
          </h2>
          <p className="text-gray-600">
            See how you stack up against fellow attendees
          </p>
        </div>

        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-800 text-center">
            🚧 <strong>Phase 0 Preview:</strong> Showing mock data. Real leaderboard coming in Phase 2!
          </p>
        </div>

        <div className="space-y-3">
          {mockLeaderboard.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center justify-between p-4 rounded-lg border-2 ${getRankColor(entry.rank)} transition hover:shadow-md`}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="text-3xl font-bold w-16 text-center">
                  {getRankBadge(entry.rank)}
                </div>
                <div className="flex-1">
                  <p className="text-xl font-semibold text-gray-800">
                    {entry.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {entry.score}
                </p>
                <p className="text-sm text-gray-500">points</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-gray-500">
          <p>🔄 Leaderboard updates automatically</p>
          <p className="text-sm">Score 80+ to win prizes! Top 3 get next year's tickets!</p>
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;
