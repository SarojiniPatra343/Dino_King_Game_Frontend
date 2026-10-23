import { useEffect, useState } from "react";
import { Trophy, RefreshCw } from "lucide-react";
import "./Leaderboard.css";

const API_URL = import.meta.env.VITE_API_URL;

function Leaderboard() {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchLeaderboard() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/api/leaderboard`);

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      // Support an array or an object containing an array.
      const leaderboard = Array.isArray(data)
        ? data
        : Array.isArray(data.leaderboard)
          ? data.leaderboard
          : Array.isArray(data.players)
            ? data.players
            : Array.isArray(data.data)
              ? data.data
              : [];

      setPlayers(leaderboard);
    } catch (err) {
      console.error("Leaderboard error:", err);
      setError("Unable to load the leaderboard. Check your backend.");
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <section className="leaderboard">
      <div className="leaderboard-heading">
        <div>
          <span className="section-tag">HALL OF FAME</span>
          <h2>
            <Trophy size={25} />
            Dino Champions
          </h2>
          <p>Meet the top players in the kingdom.</p>
        </div>

        <button
          type="button"
          className="refresh-btn"
          onClick={fetchLeaderboard}
          disabled={loading}
          aria-label="Refresh leaderboard"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {loading ? (
        <p className="leaderboard-status">Loading champions...</p>
      ) : error ? (
        <div className="leaderboard-status">
          <p>{error}</p>
          <button type="button" onClick={fetchLeaderboard}>
            Try again
          </button>
        </div>
      ) : players.length === 0 ? (
        <p className="leaderboard-status">
          No champions yet. Finish a game to claim your place!
        </p>
      ) : (
        <div className="leaderboard-list">
          {players.map((player, index) => (
            <div
              className="leaderboard-player"
              key={player.playerId || player.id || index}
            >
              <span className={`rank rank-${index + 1}`}>
                {index + 1}
              </span>

              <span className="champion-avatar">🦖</span>

              <div className="champion-info">
                <strong>
                  {player.playerName || player.name || "Dino Player"}
                </strong>
                <span>Level {player.level || 1}</span>
              </div>

              <div className="champion-score">
                <strong>{Number(player.score) || 0}</strong>
                <span>POINTS</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Leaderboard;