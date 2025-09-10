// allow spelling mistakes


import React, { useState, useEffect, useRef } from "react";
import './App.css';
import WORD_LIST from "./words";
const getRandomWord = () => WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];

function App() {
  const [grid, setGrid] = useState([Array.from({ length: 5 }, getRandomWord)]);
  const [input, setInput] = useState("");
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const inputRef = useRef(null);
  const [pointer, setPointer] = useState({ row: 0, col: 0 });
  const [feedback, setFeedback] = useState("");
  const [scorePopup, setScorePopup] = useState(""); 
  const [skipsLeft, setSkipsLeft] = useState(2);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("highScore");
    return saved ? parseInt(saved) : 0;
  });

  const resetGame = () => {
    const newGrid = [Array.from({ length: 5 }, getRandomWord)];
    setGrid(newGrid);
    setInput("");
    setScore(0);
    setSkipsLeft(2);
    setGameOver(false);
    setPointer(getRandomPointer(newGrid));
    setFeedback("");
  };

  const getRandomPointer = (grid) => {
    const nonEmptyRows = grid.filter(row => row.length > 0);
    if (nonEmptyRows.length === 0) return { row: 0, col: 0 };

    const rowIndex = Math.floor(Math.random() * nonEmptyRows.length);
    const colIndex = Math.floor(Math.random() * grid[rowIndex].length);

    const actualRow = grid.findIndex(row => row === nonEmptyRows[rowIndex]);
    return { row: actualRow, col: colIndex };
  };
  const handleSkip = () => {
    if (skipsLeft <= 0 || gameOver) return;

    setSkipsLeft(prev => prev - 1);

    setGrid(prev => {
      const newGrid = prev
        .map((rowData, rIdx) =>
          rIdx === pointer.row ? rowData.filter((_, i) => i !== pointer.col) : rowData
        )
        .filter(rowData => rowData.length > 0);

      setPointer(getRandomPointer(newGrid));
      return newGrid;
    });

    setFeedback("⏭️ Skipped!");
    setTimeout(() => setFeedback(""), 1000);
  };


  useEffect(() => {
    if (gameOver) {
      const bonus = skipsLeft * 50;
      const finalScore = score + bonus;

      setScore(finalScore); // Show updated score on screen

      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem("highScore", finalScore.toString());
      }
      return;
    }


    const interval = setInterval(() => {
      setGrid(prev => {
        const newGrid = [...prev];

        let placed = false;
        for (let i = 0; i < newGrid.length; i++) {
          if (newGrid[i].length < 5) {
            newGrid[i].push(getRandomWord());
            placed = true;
            break;
          }
        }
        if (!placed) {
          newGrid.push([getRandomWord()]);
        }

        const totalWords = newGrid.reduce((sum, row) => sum + row.length, 0);
        if (totalWords >= 50) {
          setGameOver(true);
        }

        return newGrid;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [gameOver]);


  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (gameOver) return;
    const { row, col } = pointer;
    const target_word = grid[row]?.[col];
    if (!input.trim() || !target_word) return;

    const res = await fetch("http://localhost:5000/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_word, user_input: input ,total_score: score })
    });

    const data = await res.json();
    if (data.matched) {
      setScore(prev => prev + Math.round(data.score * 100));

      setGrid(prev => {
        const newGrid = prev
          .map((rowData, rIdx) =>
            rIdx === row ? rowData.filter((_, i) => i !== col) : rowData
          )
          .filter(rowData => rowData.length > 0);

        setPointer(getRandomPointer(newGrid));
        return newGrid;
      });

      setScorePopup(`+${Math.round(data.score * 100)}`);
      setTimeout(()=>setScorePopup(""),2000);
    }
    else {
      setFeedback("❌ Try again!");
      setTimeout(() => setFeedback(""), 2000);
    }

    setInput("");
  };

  const GameOverPopup = ({ score, onRestart }) => (
    <div className="popup">
      <div className="popup-content">
        <h2>Game Over</h2>
        <p>High Score: <strong>{highScore}</strong></p>
        <p>Your Score: <strong>{score}</strong></p>
        <button onClick={onRestart}>Play Again</button>
      </div>
    </div>
  );
  

  return (
    <div className="game-container">
      <h1>ThinkLink 🕹️</h1>
      <p className="score">Score: {score}</p>
      {scorePopup && <span className="score-popup">{scorePopup}</span>}
      {/* {gameOver && <p className="game-over">Game Over!</p>} */}
      {gameOver && <GameOverPopup score={score} highScore={highScore} onRestart={resetGame} />}
      <button className="restart-button" onClick={resetGame}>Restart Game</button>


      <div className="grid-container">
        {grid.map((row, rowIndex) =>
          row.map((word, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={rowIndex === pointer.row && colIndex === pointer.col ? 'grid-cell highlight' : 'grid-cell'}
            >
              {word}
            </div>
          ))
        )}
      </div>
      {feedback && <p className="feedback">{feedback}</p>}

      <form onSubmit={handleSubmit} className="input-section">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a word for the highlighted one..."
        />
        <button type="submit">Submit</button>
        <button
          className="skip-button"
          onClick={handleSkip}
          disabled={skipsLeft <= 0}
        >
          Skip ({skipsLeft} left)
        </button>
      </form>
    </div>
  );
}

export default App;