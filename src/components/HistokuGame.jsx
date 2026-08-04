import { useState, useEffect } from 'react';
import './HistokuGame.css';

const HISTOKU_URL = '/histoku-365dias.json';

// Cacheada a nivel de módulo: evita re-descargar el JSON (~1MB) cada vez que
// se navega a otro día y el componente se remonta.
let promesaHistokuData = null;
function cargarHistokuData() {
  if (!promesaHistokuData) {
    promesaHistokuData = fetch(HISTOKU_URL).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
  }
  return promesaHistokuData;
}

// Los 365 puzzles están generados solo para fechas reales de 2026 (ver
// generate-histoku-365.js), así que cualquier fecha navegada se ancla a ese
// año por mes/día — igual que datos-365dias.json hace con MM-DD. 2026 no es
// bisiesto, así que el 29/02 cae al 28/02.
function claveHistoku(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const esBisiestoInexistente = mes === '02' && fecha.getDate() === 29;
  const dia = esBisiestoInexistente ? '28' : String(fecha.getDate()).padStart(2, '0');
  return `2026-${mes}-${dia}`;
}

export default function HistokuGame({ fecha = new Date() }) {
  const [puzzle, setPuzzle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [eliminated, setEliminated] = useState({});
  const [revealedClues, setRevealedClues] = useState([]);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'won', 'lost'
  const [time, setTime] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  // Inicializar puzzle del día navegado en Efemeris (no el reloj del dispositivo)
  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);

    cargarHistokuData()
      .then((data) => {
        if (cancelado) return;
        const clave = claveHistoku(fecha);
        const puzzleDelDia = data[clave] ?? null;
        setPuzzle(puzzleDelDia);
        setGameState('playing');
        setShowSolution(false);

        if (puzzleDelDia) {
          const guardado = localStorage.getItem(`histoku_${clave}`);
          if (guardado) {
            const { eliminated: elimGuardado, revealedClues: pistasGuardadas, time: tiempoGuardado } = JSON.parse(guardado);
            setEliminated(elimGuardado);
            setRevealedClues(pistasGuardadas);
            setTime(tiempoGuardado);
          } else {
            setEliminated({});
            setRevealedClues([]);
            setTime(0);
          }
        }
      })
      .catch((err) => {
        if (!cancelado) setError(err.message);
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [fecha]);

  // Timer: se detiene al ganar/rendirse, no solo al desmontar
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameState]);

  // Guardar progreso
  useEffect(() => {
    if (puzzle) {
      localStorage.setItem(`histoku_${puzzle.date}`, JSON.stringify({
        eliminated,
        revealedClues,
        time
      }));
    }
  }, [eliminated, revealedClues, time, puzzle]);

  if (cargando) {
    return (
      <div className="histoku-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando puzzle del día...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="histoku-container">
        <p>No se pudo cargar Histoku ({error}).</p>
      </div>
    );
  }

  if (!puzzle) {
    return (
      <div className="histoku-container">
        <p>No hay puzzle de Histoku para este día.</p>
      </div>
    );
  }

  // Toggle celda eliminada/no eliminada
  const toggleCell = (charId, locId) => {
    const key = `${charId}-${locId}`;
    setEliminated(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Verificar respuesta
  const verifyAnswer = () => {
    let isCorrect = true;
    const userSolution = {};

    // Recolectar selecciones del usuario
    for (let char of puzzle.characters) {
      let selectedLocId = null;
      for (let loc of puzzle.locations) {
        const key = `${char.id}-${loc.id}`;
        if (!eliminated[key]) {
          if (selectedLocId !== null) {
            // Múltiples selecciones para un personaje
            isCorrect = false;
            break;
          }
          selectedLocId = loc.id;
        }
      }
      
      if (selectedLocId === null) {
        // Personaje sin ubicación asignada
        isCorrect = false;
        break;
      }
      
      userSolution[char.id] = selectedLocId;
      
      // Verificar si coincide con solución
      if (userSolution[char.id] !== puzzle.solution[char.id]) {
        isCorrect = false;
      }
    }

    if (isCorrect) {
      setGameState('won');
      updateStats(puzzle.date, time);
    } else {
      alert('❌ Solución incorrecta. Intenta de nuevo.');
    }
  };

  // Revelar pista
  const revealClue = (clueId) => {
    if (!revealedClues.includes(clueId)) {
      setRevealedClues(prev => [...prev, clueId]);
    }
  };

  // Rendirse
  const giveUp = () => {
    setGameState('lost');
    setShowSolution(true);
  };

  // Actualizar estadísticas
  const updateStats = (date, seconds) => {
    const stats = JSON.parse(localStorage.getItem('histoku_stats') || '{}');
    const today = new Date().toISOString().split('T')[0];
    
    stats[today] = {
      solved: true,
      time: seconds,
      cluesUsed: revealedClues.length,
      date: new Date().toLocaleDateString('es-ES')
    };
    
    localStorage.setItem('histoku_stats', JSON.stringify(stats));
  };

  // Formatear tiempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Resetear juego
  const resetGame = () => {
    setEliminated({});
    setRevealedClues([]);
    setTime(0);
    setGameState('playing');
    setShowSolution(false);
    localStorage.removeItem(`histoku_${puzzle.date}`);
  };

  return (
    <div className="histoku-container">
      <div className="histoku-header">
        <div className="header-content">
          <h2>🔍 {puzzle.title}</h2>
          <p className="description">{puzzle.description}</p>
          <div className="meta-info">
            <span className="theme">🎭 {puzzle.theme}</span>
            <span className="difficulty">📊 {puzzle.difficulty}</span>
          </div>
        </div>
      </div>

      {gameState === 'playing' && !showSolution && (
        <>
          {/* GRID PRINCIPAL */}
          <div className="histoku-grid-wrapper">
            <div
              className="histoku-grid"
              style={{ gridTemplateColumns: `minmax(0, 1.15fr) repeat(${puzzle.locations.length}, minmax(0, 1fr))` }}
            >
              {/* Encabezado columnas */}
              <div className="grid-header">
                <div className="corner"></div>
                {puzzle.locations.map(loc => (
                  <div key={`header-${loc.id}`} className="grid-col-header">
                    <span className="loc-name">{loc.name}</span>
                  </div>
                ))}
              </div>

              {/* Filas de personajes */}
              {puzzle.characters.map(char => (
                <div key={`row-${char.id}`} className="grid-row">
                  <div className={`grid-row-header ${char.type === 'victim' ? 'victim' : ''}`}>
                    <span className="char-name">{char.name}</span>
                  </div>
                  {puzzle.locations.map(loc => {
                    const key = `${char.id}-${loc.id}`;
                    const isEliminated = eliminated[key];
                    return (
                      <div
                        key={key}
                        className={`grid-cell ${isEliminated ? 'eliminated' : 'possible'}`}
                        onClick={() => toggleCell(char.id, loc.id)}
                        title={isEliminated ? 'Clic para posible' : 'Clic para eliminar'}
                      >
                        {isEliminated ? '✗' : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* INSTRUCCIONES */}
          <div className="histoku-help">
            <p>
              <strong>Cómo jugar:</strong> Haz clic en cada casilla para marcar como <strong>✗ (eliminada)</strong> o 
              <strong> · (posible)</strong>. Los puntos indican donde crees que está cada personaje. 
              Una persona por fila y columna.
            </p>
          </div>

          {/* PISTAS */}
          <div className="histoku-clues">
            <h4>💡 Pistas ({revealedClues.length}/{puzzle.clues.length})</h4>
            <div className="clues-list">
              {puzzle.clues.map((clue, idx) => (
                <div
                  key={idx}
                  className={`clue ${revealedClues.includes(idx) ? 'revealed' : 'hidden'}`}
                >
                  <button
                    className={`clue-reveal-btn ${revealedClues.includes(idx) ? 'active' : ''}`}
                    onClick={() => revealClue(idx)}
                    disabled={revealedClues.includes(idx)}
                    title={revealedClues.includes(idx) ? 'Pista revelada' : 'Pulsa para revelar'}
                  >
                    {revealedClues.includes(idx) ? '✓' : '?'}
                  </button>
                  <span className="clue-text">
                    {revealedClues.includes(idx) 
                      ? clue.text 
                      : `Pista ${idx + 1} (Pulsa para revelar)`
                    }
                  </span>
                  {revealedClues.includes(idx) && (
                    <span className="clue-type" title={`Tipo: ${clue.type}`}>
                      [{clue.type}]
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ESTADÍSTICAS */}
          <div className="histoku-stats">
            <span className="stat">
              <span className="stat-icon">⏱️</span>
              {formatTime(time)}
            </span>
            <span className="stat">
              <span className="stat-icon">💡</span>
              {revealedClues.length}/{puzzle.clues.length}
            </span>
            <span className="stat">
              <span className="stat-icon">📊</span>
              {Object.values(eliminated).filter(Boolean).length}/{puzzle.characters.length * puzzle.locations.length}
            </span>
          </div>

          {/* BOTONES */}
          <div className="histoku-buttons">
            <button className="btn-verify" onClick={verifyAnswer}>
              ✓ Verificar
            </button>
            <button className="btn-surrender" onClick={giveUp}>
              ⏹️ Rendirse
            </button>
          </div>
        </>
      )}

      {/* PANTALLA DE VICTORIA */}
      {gameState === 'won' && (
        <div className="game-result won">
          <div className="result-content">
            <h3>🎉 ¡Correcto!</h3>
            <p className="result-message">¡Resolviste el misterio!</p>
            
            <div className="result-stats">
              <div className="stat-card">
                <span className="stat-value">{formatTime(time)}</span>
                <span className="stat-label">Tiempo</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{revealedClues.length}</span>
                <span className="stat-label">Pistas usadas</span>
              </div>
            </div>

            <div className="killer-reveal">
              <p className="killer-label">El culpable era:</p>
              <p className="killer-name">🔴 {puzzle.killer.name}</p>
              <p className="killer-reason">{puzzle.killer.reason}</p>
            </div>

            <div className="result-actions">
              <button onClick={() => window.location.reload()} className="btn-primary">
                Volver a Efemeris
              </button>
              <button onClick={resetGame} className="btn-secondary">
                Jugar de Nuevo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PANTALLA DE DERROTA */}
      {gameState === 'lost' && (
        <div className="game-result lost">
          <div className="result-content">
            <h3>😢 Rendido</h3>
            <p className="result-message">Aquí está la solución correcta:</p>

            <div className="solution">
              <div className="solution-grid">
                {puzzle.characters.map(char => {
                  const locId = puzzle.solution[char.id];
                  const location = puzzle.locations.find(l => l.id === locId);
                  const isKiller = puzzle.killer.id === char.id;
                  
                  return (
                    <div key={char.id} className={`solution-item ${isKiller ? 'killer' : ''}`}>
                      <span className={`char-icon ${char.type === 'victim' ? 'victim' : ''}`}>
                        {char.type === 'victim' ? '🎯' : '👤'}
                      </span>
                      <div className="solution-info">
                        <p className="solution-char">{char.name}</p>
                        <p className="solution-loc">{location?.name}</p>
                      </div>
                      {isKiller && <span className="killer-badge">🔴 CULPABLE</span>}
                    </div>
                  );
                })}
              </div>

              <div className="solution-explanation">
                <h4>¿Por qué?</h4>
                <p>{puzzle.killer.reason}</p>
              </div>
            </div>

            <div className="result-actions">
              <button onClick={() => window.location.reload()} className="btn-primary">
                Volver a Efemeris
              </button>
              <button onClick={resetGame} className="btn-secondary">
                Intentar de Nuevo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
