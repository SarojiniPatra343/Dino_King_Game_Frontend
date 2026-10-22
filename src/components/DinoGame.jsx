
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Heart, Coins, Trophy, RotateCcw } from "lucide-react";
import "./DinoGame.css";

const API_URL = "http://localhost:5000";
const WIDTH = 900;
const HEIGHT = 360;
const GROUND = 300;

function createGame() {
  return {
    player: { x: 90, y: GROUND - 48, w: 42, h: 48, vy: 0 },
    obstacles: [],
    coins: [],
    score: 0,
    coinsCollected: 0,
    lives: 3,
    level: 1,
    speed: 5,
    frame: 0,
    gameOver: false,
    started: false,
    invincible: 0,
  };
}

export default function DinoGame({
  playerName = "Dino Player",
  playerId = "",
  onExit,
}) {
  const canvasRef = useRef(null);
  const gameRef = useRef(createGame());
  const animationRef = useRef(0);
  const jumpRef = useRef(false);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  const jump = useCallback(() => {
    const game = gameRef.current;
    if (game.gameOver) return;
    game.started = true;

    if (game.player.y >= GROUND - game.player.h - 1) {
      game.player.vy = -13;
    }
  }, []);

  const restart = useCallback(() => {
    gameRef.current = createGame();
    jumpRef.current = false;
    setScore(0);
    setCoins(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setSavedMessage("");
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let active = true;
    let lastUiUpdate = 0;
    let obstacleTimer = 0;
    let coinTimer = 0;

    function rectangleCollision(a, b) {
      return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
      );
    }

    function drawDinosaur(player, blink) {
      if (blink && Math.floor(gameRef.current.frame / 5) % 2 === 0) {
        return;
      }

      ctx.fillStyle = "#42d66b";
      ctx.fillRect(player.x + 5, player.y + 15, 30, 30);
      ctx.fillRect(player.x + 20, player.y, 28, 24);
      ctx.fillRect(player.x + 35, player.y + 8, 18, 12);

      ctx.fillStyle = "#b5ff9c";
      ctx.fillRect(player.x + 23, player.y + 24, 12, 16);

      ctx.fillStyle = "#101a15";
      ctx.fillRect(player.x + 38, player.y + 5, 5, 5);

      ctx.fillStyle = "#42d66b";
      ctx.fillRect(player.x + 9, player.y + 41, 10, 9);
      ctx.fillRect(player.x + 25, player.y + 41, 10, 9);
      ctx.fillRect(player.x - 7, player.y + 20, 14, 8);
    }

    function draw() {
      const game = gameRef.current;

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      // Sky
      const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      gradient.addColorStop(0, "#102a26");
      gradient.addColorStop(1, "#17251f");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Decorative sun and clouds
      ctx.fillStyle = "rgba(125, 255, 154, 0.12)";
      ctx.beginPath();
      ctx.arc(730, 75, 42, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#30483b";
      for (let i = 0; i < 5; i++) {
        const x = ((i * 210 - game.frame * 0.5) % 1100 + 1100) % 1100 - 100;
        ctx.beginPath();
        ctx.moveTo(x, GROUND);
        ctx.lineTo(x + 100, 195 + (i % 2) * 25);
        ctx.lineTo(x + 210, GROUND);
        ctx.fill();
      }

      // Ground
      ctx.fillStyle = "#243e2e";
      ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
      ctx.fillStyle = "#58d977";
      ctx.fillRect(0, GROUND, WIDTH, 4);

      ctx.strokeStyle = "#41684a";
      ctx.lineWidth = 2;
      for (let i = 0; i < WIDTH; i += 40) {
        const x = (i - (game.frame * game.speed) % 40 + WIDTH) % WIDTH;
        ctx.beginPath();
        ctx.moveTo(x, GROUND + 20);
        ctx.lineTo(x + 16, GROUND + 20);
        ctx.stroke();
      }

      // Obstacles
      game.obstacles.forEach((obstacle) => {
        ctx.fillStyle = "#d88b4a";
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.w, obstacle.h);
        ctx.fillStyle = "#ffbb69";
        ctx.fillRect(obstacle.x + 5, obstacle.y + 7, 5, 12);
      });

      // Coins
      game.coins.forEach((coin) => {
        ctx.fillStyle = "#ffcf43";
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#fff0a0";
        ctx.lineWidth = 3;
        ctx.stroke();
      });

      drawDinosaur(
        game.player,
        game.invincible > 0
      );

      if (!game.started && !game.gameOver) {
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.font = "bold 24px system-ui";
        ctx.fillText("TAP JUMP OR PRESS SPACE", WIDTH / 2, 90);
        ctx.font = "16px system-ui";
        ctx.fillText("Collect coins and dodge the obstacles!", WIDTH / 2, 120);
      }

      ctx.textAlign = "left";
    }

    function finishGame() {
      const game = gameRef.current;
      game.gameOver = true;
      setScore(game.score);
      setCoins(game.coinsCollected);
      setLives(game.lives);
      setLevel(game.level);
      setGameOver(true);
    }

    function frame(timestamp) {
      if (!active) return;

      const game = gameRef.current;

      if (!game.gameOver && game.started) {
        game.frame += 1;
        game.speed = 5 + (game.level - 1) * 0.65;

        game.player.y += game.player.vy;
        game.player.vy += 0.65;

        if (game.player.y > GROUND - game.player.h) {
          game.player.y = GROUND - game.player.h;
          game.player.vy = 0;
        }

        if (game.invincible > 0) game.invincible -= 1;

        obstacleTimer -= 1;
        if (obstacleTimer <= 0) {
          const height = 28 + Math.random() * 24;
          game.obstacles.push({
            x: WIDTH + 20,
            y: GROUND - height,
            w: 24 + Math.random() * 16,
            h: height,
          });
          obstacleTimer = 65 + Math.random() * 55;
        }

        coinTimer -= 1;
        if (coinTimer <= 0) {
          game.coins.push({
            x: WIDTH + 20,
            y: GROUND - 80 - Math.random() * 90,
            w: 20,
            h: 20,
          });
          coinTimer = 75 + Math.random() * 55;
        }

        game.obstacles.forEach((obstacle) => {
          obstacle.x -= game.speed;

          if (
            game.invincible === 0 &&
            rectangleCollision(game.player, obstacle)
          ) {
            game.lives -= 1;
            game.invincible = 70;
            obstacle.x = -100;

            setLives(game.lives);

            if (game.lives <= 0) {
              finishGame();
            }
          }
        });

        game.coins.forEach((coin) => {
          coin.x -= game.speed;

          if (rectangleCollision(game.player, coin)) {
            coin.x = -100;
            game.coinsCollected += 1;
            game.score += 10;
            setCoins(game.coinsCollected);
            setScore(game.score);
          }
        });

        game.obstacles = game.obstacles.filter((item) => item.x > -100);
        game.coins = game.coins.filter((item) => item.x > -100);

        if (game.frame % 5 === 0) {
          game.score += 1;
        }

        const nextLevel = Math.floor(game.score / 100) + 1;
        if (nextLevel !== game.level) {
          game.level = nextLevel;
          setLevel(nextLevel);
        }

        if (timestamp - lastUiUpdate > 150) {
          lastUiUpdate = timestamp;
          setScore(game.score);
        }
      }

      draw();
      animationRef.current = requestAnimationFrame(frame);
    }

    function handleKeyDown(event) {
      if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
        event.preventDefault();
        if (!jumpRef.current) {
          jump();
          jumpRef.current = true;
        }
      }
    }

    function handleKeyUp(event) {
      if (["Space", "ArrowUp", "KeyW"].includes(event.code)) {
        jumpRef.current = false;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    animationRef.current = requestAnimationFrame(frame);

    return () => {
      active = false;
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [jump]);

  // Save each completed game once.
  useEffect(() => {
    if (!gameOver) return;

    let cancelled = false;

    async function saveScore() {
      if (!playerId) {
        setSavedMessage("Guest ID missing. Score was not saved.");
        return;
      }

      try {
        const response = await fetch(`${API_URL}/api/scores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId,
            playerName,
            score,
            coins,
            level,
          }),
        });

        if (!response.ok) {
          throw new Error("Server rejected the score.");
        }

        if (!cancelled) {
          setSavedMessage("Score saved to MongoDB!");
        }
      } catch (error) {
        console.error("Could not save score:", error);
        if (!cancelled) {
          setSavedMessage("Could not save score. Check your backend.");
        }
      }
    }

    saveScore();

    return () => {
      cancelled = true;
    };
  }, [gameOver, playerId, playerName, score, coins, level]);

  async function toggleFullscreen() {
    const element = document.querySelector(".dino-game");

    try {
      if (!document.fullscreenElement) {
        await element?.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch (error) {
      console.error("Fullscreen is not available:", error);
    }
  }

  return (
    <main className="dino-game">
      <header className="game-header">
        <button className="game-back" onClick={onExit}>
          <ArrowLeft size={18} /> Lobby
        </button>

        <div className="game-title">
          <span>🦖</span>
          <div>
            <strong>THE DINO KING</strong>
            <small>Player: {playerName}</small>
          </div>
        </div>

        <button className="fullscreen-btn" onClick={toggleFullscreen}>
          {fullscreen ? "Exit fullscreen" : "Fullscreen"}
        </button>
      </header>

      <section className="game-stats">
        <div><Trophy size={18} /><span>Score</span><strong>{score}</strong></div>
        <div><Coins size={18} /><span>Coins</span><strong>{coins}</strong></div>
        <div><Heart size={18} /><span>Lives</span><strong>{Math.max(0, lives)}</strong></div>
        <div><span>LEVEL</span><strong>{level}</strong></div>
      </section>

      <section className="game-board">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          onPointerDown={jump}
          aria-label="Dinosaur game. Tap to jump over obstacles and collect coins."
        />

        {gameOver && (
          <div className="game-over">
            <span className="game-over-dino">🦖</span>
            <h2>Adventure Over!</h2>
            <p>Final score: <strong>{score}</strong></p>
            <p>Coins collected: <strong>{coins}</strong></p>
            <p>Level reached: <strong>{level}</strong></p>
            <p className="save-message">{savedMessage}</p>

            <button className="restart-btn" onClick={restart}>
              <RotateCcw size={18} /> PLAY AGAIN
            </button>
          </div>
        )}
      </section>

      <div className="game-controls">
        <p>Use <kbd>SPACE</kbd> or <kbd>↑</kbd> to jump. On mobile, tap the game.</p>
        <button className="touch-jump" onPointerDown={(event) => {
          event.preventDefault();
          jump();
        }}>
          JUMP
        </button>
      </div>

      <footer className="game-footer">
        <span>🪙 Collect coins for bonus points</span>
        <span>❤️ Avoid obstacles to survive</span>
      </footer>
    </main>
  );
}
