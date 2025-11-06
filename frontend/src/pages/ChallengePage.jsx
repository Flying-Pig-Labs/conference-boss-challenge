import React from 'react';

/**
 * Challenge Page
 *
 * Main interaction page where users:
 * 1. Enter their name
 * 2. Record 15-second audio response
 * 3. Submit and get scored
 * 4. See their score and roast
 *
 * This is a placeholder - full implementation in Phase 2
 */
function ChallengePage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="card text-center">
        <h2 className="text-4xl font-bold text-gray-800 mb-6">
          Ready for the Boss?
        </h2>

        <div className="mb-8">
          <p className="text-xl text-gray-600 mb-2">
            Your boss wants to know:
          </p>
          <p className="text-3xl font-bold text-blue-600 italic">
            "How was the conference?"
          </p>
          <p className="text-lg text-gray-500 mt-2">
            (that I paid for you to go to)
          </p>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6 mb-8">
          <p className="text-lg text-yellow-800">
            🚧 <strong>Phase 0 - Project Setup Complete!</strong> 🚧
          </p>
          <p className="text-sm text-yellow-700 mt-2">
            The audio recording and submission flow will be implemented in Phase 2.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-left text-gray-700 font-semibold mb-2">
              Your Name:
            </label>
            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-lg"
              disabled
            />
          </div>

          <button
            className="btn-primary w-full text-2xl py-6 opacity-50 cursor-not-allowed"
            disabled
          >
            🎤 Reply to Boss (Coming Soon)
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>✓ You'll have 15 seconds to explain the ROI</p>
          <p>✓ Get scored 0-100 by AI</p>
          <p>✓ Receive a playful roast</p>
          <p>✓ Win prizes for high scores!</p>
        </div>
      </div>
    </div>
  );
}

export default ChallengePage;
