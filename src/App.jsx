
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  Crown,
  Gamepad2,
  Users,
  Copy,
  Zap,
  Shield,
  RefreshCw,
} from "lucide-react";

import DinoGame from "./components/DinoGame";
import Leaderboard from "./components/Leaderboard";
import "./App.css";

const SOCKET_URL = "http://localhost:5000";

function App() {
  const [playerName, setPlayerName] = useState("");
  const [showGame, setShowGame] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [socket, setSocket] = useState(null);
  const [currentRoom, setCurrentRoom] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [players, setPlayers] = useState([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);

  // Connect to the Socket.IO server.
  useEffect(() => {
    const newSocket = io(SOCKET_URL);

    setSocket(newSocket);

    newSocket.on("connect", () => {
      setConnected(true);
      setMessage("");
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
      setMessage("Server disconnected. Please reconnect.");
    });

    newSocket.on("connect_error", () => {
      setConnected(false);
      setMessage("Cannot connect to the server. Check your backend.");
    });

    // Keep the player list synchronized with room membership.
    newSocket.on("room-updated", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Handle successful room creation or joining.
  function handleRoomResult(result) {
    setBusy(false);

    if (!result?.success) {
      setMessage(result?.message || "Something went wrong.");
      return;
    }

    setCurrentRoom(result.roomCode);
    setPlayerId(result.player.id);
    setPlayers(result.players || []);
    setMessage("Welcome to the Dino Kingdom!");
  }

  // Create a new room.
  function createRoom() {
    if (!playerName.trim()) {
      setMessage("Enter your player name first.");
      return;
    }

    if (!socket?.connected) {
      setMessage("Wait for the server connection and try again.");
      return;
    }

    setBusy(true);
    setMessage("");

    socket.emit(
      "create-room",
      { playerName: playerName.trim() },
      handleRoomResult
    );
  }

  // Join a room using a shareable code.
  function joinRoom() {
    if (!playerName.trim()) {
      setMessage("Enter your player name first.");
      return;
    }

    if (!roomCode.trim()) {
      setMessage("Enter the room code shared by your friend.");
      return;
    }

    if (!socket?.connected) {
      setMessage("Wait for the server connection and try again.");
      return;
    }

    setBusy(true);
    setMessage("");

    socket.emit(
      "join-room",
      {
        playerName: playerName.trim(),
        roomCode: roomCode.trim().toUpperCase(),
      },
      handleRoomResult
    );
  }

  // Copy the room code to the clipboard.
  async function copyRoomCode() {
    try {
      await navigator.clipboard.writeText(currentRoom);
      setMessage("Room code copied! Share it with your friends.");
    } catch {
      setMessage(`Share this room code with your friends: ${currentRoom}`);
    }
  }

  // Return from the game to the lobby.
  function exitGame() {
    setShowGame(false);
  }

  // Display the game outside the lobby.
  if (showGame && currentRoom) {
    return (
      <DinoGame
        playerName={playerName}
        playerId={playerId}
        onExit={exitGame}
      />
    );
  }

  return (
    <main className="app">
      <nav className="navbar">
        <a
          className="brand"
          href="#"
          onClick={(event) => event.preventDefault()}
        >
          <span className="brand-icon">
            <Crown />
          </span>

          <span>
            DINO<span className="green"> KING</span>
          </span>
        </a>

        <span className="online">
          <span
            className="online-dot"
            style={{
              background: connected ? "#42d66b" : "#f59e0b",
            }}
          />
          {connected ? "MULTIPLAYER ONLINE" : "CONNECTING..."}
        </span>
      </nav>

      <section className="hero">
        <div className="hero-content">
          <div className="eyebrow">
            <Zap size={16} />
            YOUR ADVENTURE STARTS HERE
          </div>

          <h1>
            RULE THE
            <br />
            <span>JUNGLE.</span>
          </h1>

          <p className="subtitle">
            Enter a prehistoric world, challenge your friends,
            and become the ultimate Dino King.
          </p>

          <div className="features">
            <span>
              <Users size={17} />
              Up to 8 players
            </span>

            <span>
              <Shield size={17} />
              Guest play
            </span>

            <span>
              <Gamepad2 size={17} />
              Cross-device
            </span>
          </div>
        </div>

        <div className="dino-scene" aria-label="Dinosaur game artwork">
          <div className="sun" />
          <div className="mountain mountain-one" />
          <div className="mountain mountain-two" />

          <div className="dino">
            <div className="dino-tail" />

            <div className="dino-body">
              <div className="dino-belly" />
              <div className="dino-eye" />
              <div className="dino-cheek" />
            </div>

            <div className="dino-head">
              <div className="dino-eye" />
              <div className="dino-nose" />
            </div>

            <div className="dino-leg leg-one" />
            <div className="dino-leg leg-two" />
          </div>

          <div className="ground" />

          <span className="scene-label">THE KINGDOM AWAITS</span>
        </div>
      </section>

      <section className="lobby">
        <div className="lobby-heading">
          <span className="section-tag">PLAYER LOBBY</span>
          <h2>Ready to play?</h2>
          <p>Choose your name and jump into the adventure.</p>
        </div>

        {!currentRoom ? (
          <div className="lobby-card">
            <label htmlFor="playerName">YOUR PLAYER NAME</label>

            <input
              id="playerName"
              maxLength={20}
              placeholder="Enter your dino name..."
              value={playerName}
              onChange={(event) => setPlayerName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") createRoom();
              }}
            />

            <button
              type="button"
              className="primary-btn"
              onClick={createRoom}
              disabled={busy || !connected}
            >
              <Crown size={19} />
              {busy ? "CONNECTING..." : "CREATE A ROOM"}
            </button>

            <div className="or-divider">
              <span>OR JOIN FRIENDS</span>
            </div>

            <div className="join-row">
              <input
                aria-label="Room code"
                maxLength={6}
                placeholder="ENTER ROOM CODE"
                value={roomCode}
                onChange={(event) =>
                  setRoomCode(event.target.value.toUpperCase())
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") joinRoom();
                }}
              />

              <button
                type="button"
                className="join-btn"
                onClick={joinRoom}
                disabled={busy || !connected}
              >
                JOIN <span>→</span>
              </button>
            </div>

            {message && <p className="message">{message}</p>}
          </div>
        ) : (
          <div className="lobby-card room-card">
            <span className="section-tag">ROOM CREATED</span>

            <h2>Your room is ready!</h2>

            <p>
              Share this code with your friends so they can join.
            </p>

            <button
              type="button"
              className="room-code"
              onClick={copyRoomCode}
            >
              {currentRoom}
              <Copy size={18} />
            </button>

            <p className="player-id">
              Your guest ID: {playerId}
            </p>

            <h3>Players in this room ({players.length}/8)</h3>

            <div className="players-list">
              {players.map((player) => (
                <div className="player-item" key={player.id}>
                  <span className="player-avatar">🦖</span>
                  <span>{player.name}</span>

                  {player.id === playerId && (
                    <span className="you-tag">YOU</span>
                  )}
                </div>
              ))}
            </div>

            {message && <p className="message">{message}</p>}

            <p className="waiting">
              {players.length > 1
                ? "Your fellow dinosaurs have arrived!"
                : "Waiting for your fellow dinosaurs..."}
            </p>

            <button
              type="button"
              className="primary-btn"
              onClick={() => setShowGame(true)}
            >
              🦖 START DINO ADVENTURE
            </button>
          </div>
        )}
      </section>

      {/* MongoDB-backed leaderboard */}
      <Leaderboard />

      <footer>
        <span>🦖 THE DINO KING</span>
        <span>ONE JUNGLE. ONE KING.</span>
      </footer>
    </main>
  );
}

export default App;