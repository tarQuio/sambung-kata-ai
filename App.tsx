
import React, { useState, useEffect, useCallback } from 'react';
import { GameMode, PlayerType, GameState, GameTheme } from './types';
import { validateWordWithAI, getAIMove } from './services/geminiService';
import { Button } from './components/Button';
import { WordInput } from './components/WordInput';
import { GameBoard } from './components/GameBoard';
import { BrainCircuit, Users, RefreshCw, Trophy, ArrowLeft, CheckCircle2, Flame } from 'lucide-react';

const TURN_DURATION = 30; // Seconds per turn

const App: React.FC = () => {
  const [selectedTheme, setSelectedTheme] = useState<GameTheme>(GameTheme.ANY);
  const [gameState, setGameState] = useState<GameState>({
    mode: GameMode.MENU,
    theme: GameTheme.ANY,
    currentTurn: PlayerType.PLAYER_1,
    history: [],
    streak: 0,
    isGameOver: false,
    winner: null,
    lastWord: null,
    timer: TURN_DURATION
  });

  const [isLoading, setIsLoading] = useState(false);
  const [pendingWord, setPendingWord] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- Timer Logic ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState.mode !== GameMode.MENU && !gameState.isGameOver && !isLoading) {
      interval = setInterval(() => {
        setGameState(prev => {
          if (prev.timer <= 1) {
            // Time out logic
            const winner = prev.currentTurn === PlayerType.PLAYER_1 
              ? (prev.mode === GameMode.PVE ? PlayerType.AI : PlayerType.PLAYER_2)
              : PlayerType.PLAYER_1;
            
            return {
              ...prev,
              isGameOver: true,
              winner,
              timer: 0
            };
          }
          return { ...prev, timer: prev.timer - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState.mode, gameState.isGameOver, gameState.currentTurn, isLoading]);

  // --- AI Turn Logic ---
  useEffect(() => {
    const triggerAITurn = async () => {
      if (
        gameState.mode === GameMode.PVE && 
        gameState.currentTurn === PlayerType.AI && 
        !gameState.isGameOver
      ) {
        setIsLoading(true);
        // Small delay for realism and UI update
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const aiResult = await getAIMove(gameState.history, gameState.lastWord, gameState.theme);
        
        if (aiResult.surrender) {
          handleGameOver(PlayerType.PLAYER_1);
          setIsLoading(false);
        } else {
          commitMove(aiResult.word, PlayerType.AI);
          setIsLoading(false);
        }
      }
    };

    triggerAITurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.currentTurn, gameState.mode, gameState.isGameOver]);

  // --- Core Game Logic ---

  const startGame = (mode: GameMode) => {
    setGameState({
      mode,
      theme: selectedTheme,
      currentTurn: PlayerType.PLAYER_1,
      history: [],
      streak: 0,
      isGameOver: false,
      winner: null,
      lastWord: null,
      timer: TURN_DURATION
    });
    setErrorMsg(null);
    setPendingWord(null);
  };

  const handleGameOver = (winner: PlayerType) => {
    setGameState(prev => ({
      ...prev,
      isGameOver: true,
      winner
    }));
  };

  // We no longer deduct points, we just show error and time keeps ticking
  const showPenaltyMessage = (reason: string) => {
    setErrorMsg(`${reason}`);
  };

  const commitMove = (word: string, player: PlayerType) => {
    setGameState(prev => {
      const nextTurn = prev.mode === GameMode.PVE 
        ? (player === PlayerType.PLAYER_1 ? PlayerType.AI : PlayerType.PLAYER_1)
        : (player === PlayerType.PLAYER_1 ? PlayerType.PLAYER_2 : PlayerType.PLAYER_1);

      const newHistory = [
        ...prev.history,
        { id: Date.now().toString(), word, player, timestamp: Date.now() }
      ];

      return {
        ...prev,
        history: newHistory,
        streak: newHistory.length, // Streak is simply total words in chain
        currentTurn: nextTurn,
        lastWord: word,
        timer: TURN_DURATION
      };
    });
  };

  const validateAndSubmit = async (inputWord: string) => {
    setErrorMsg(null);
    const word = inputWord.toLowerCase().trim();

    setPendingWord(word);
    setIsLoading(true);

    try {
      // 1. Basic checks
      if (!word) throw new Error("Kata kosong");
      if (word.includes(" ")) throw new Error("Hanya satu kata!");

      // 2. Chain rule check
      if (gameState.lastWord) {
        const requiredChar = gameState.lastWord.slice(-1).toLowerCase();
        if (word.charAt(0) !== requiredChar) {
           throw new Error(`Kata harus dimulai dengan huruf '${requiredChar.toUpperCase()}'!`);
        }
      }

      // 3. Duplicate check
      const isDuplicate = gameState.history.some(h => h.word.toLowerCase() === word);
      if (isDuplicate) {
        throw new Error("Kata ini sudah digunakan!");
      }

      // 4. Validity & Theme check (KBBI + Theme via Gemini)
      const validation = await validateWordWithAI(word, gameState.theme);
      
      if (!validation.isValid) {
        throw new Error(validation.message || "Kata tidak valid menurut KBBI.");
      }

      if (!validation.fitsTheme) {
        // Just show error, do not commit
        showPenaltyMessage(`Kata tidak sesuai tema '${gameState.theme}'!`);
        return;
      }

      // Success
      commitMove(word, gameState.currentTurn);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsLoading(false);
      setPendingWord(null);
    }
  };

  const getRequiredLetter = useCallback(() => {
    if (!gameState.lastWord) return null;
    return gameState.lastWord.slice(-1).toLowerCase();
  }, [gameState.lastWord]);


  // --- Render Sections ---

  if (gameState.mode === GameMode.MENU) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center space-y-2">
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
              Sambung Kata
            </h1>
            <p className="text-slate-400 text-lg">Asah otak, sambung kata, lawan AI!</p>
          </div>

          {/* Theme Selection */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
             <h3 className="text-slate-300 font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-400"/>
                Pilih Tema:
             </h3>
             <div className="grid grid-cols-2 gap-2">
                {Object.values(GameTheme).map(theme => (
                    <button
                        key={theme}
                        onClick={() => setSelectedTheme(theme)}
                        className={`text-sm py-2 px-3 rounded-lg border transition-all ${selectedTheme === theme 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' 
                            : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'}`}
                    >
                        {theme}
                    </button>
                ))}
             </div>
          </div>

          <div className="grid gap-4">
            <button 
              onClick={() => startGame(GameMode.PVE)}
              className="group relative p-6 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 transition-all hover:scale-105 shadow-xl flex items-center gap-4 text-left overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-4 bg-indigo-500 rounded-full text-white shadow-lg shadow-indigo-500/30">
                <BrainCircuit size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Lawan AI</h3>
                <p className="text-sm text-slate-400">Tantang Gemini AI (Tema: {selectedTheme})</p>
              </div>
            </button>

            <button 
              onClick={() => startGame(GameMode.PVP_LOCAL)}
              className="group relative p-6 bg-slate-800 hover:bg-slate-700 rounded-2xl border border-slate-700 transition-all hover:scale-105 shadow-xl flex items-center gap-4 text-left overflow-hidden"
            >
               <div className="absolute inset-0 bg-gradient-to-r from-pink-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-4 bg-pink-500 rounded-full text-white shadow-lg shadow-pink-500/30">
                <Users size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Main Lokal</h3>
                <p className="text-sm text-slate-400">Main berdua (Tema: {selectedTheme})</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // GAME OVER SCREEN
  if (gameState.isGameOver) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
        <div className="max-w-md w-full bg-slate-800 p-8 rounded-3xl border border-slate-700 text-center shadow-2xl animate-in zoom-in duration-300">
          <div className="mb-6 flex justify-center">
             {gameState.winner === PlayerType.AI ? (
               <div className="p-6 bg-red-500/20 rounded-full text-red-400 ring-4 ring-red-500/20">
                 <BrainCircuit size={64} />
               </div>
             ) : (
                <div className="p-6 bg-yellow-500/20 rounded-full text-yellow-400 ring-4 ring-yellow-500/20 animate-bounce">
                  <Trophy size={64} />
                </div>
             )}
          </div>
          
          <h2 className="text-3xl font-bold mb-2">
            {gameState.winner === PlayerType.AI ? "AI Menang!" : (
              gameState.mode === GameMode.PVP_LOCAL 
                ? (gameState.winner === PlayerType.PLAYER_1 ? "Player 1 Menang!" : "Player 2 Menang!")
                : "Kamu Menang!"
            )}
          </h2>
          <div className="my-6 bg-slate-900 p-4 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">Total Streak</p>
            <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 flex items-center justify-center gap-2">
               <Flame size={32} /> {gameState.streak}
            </div>
          </div>

          <div className="space-y-3">
             <Button onClick={() => startGame(gameState.mode)} className="w-full justify-center">
               <RefreshCw size={20} /> Main Lagi
             </Button>
             <Button variant="ghost" onClick={() => setGameState(prev => ({ ...prev, mode: GameMode.MENU, isGameOver: false }))} className="w-full justify-center">
               <ArrowLeft size={20} /> Kembali ke Menu
             </Button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE GAME PLAY
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col p-4 md:p-6 lg:p-8 max-w-5xl mx-auto overflow-hidden">
      <header className="flex items-center justify-between mb-4 z-10 relative">
        <button 
          onClick={() => setGameState(prev => ({ ...prev, mode: GameMode.MENU }))}
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium"
        >
          <ArrowLeft size={16} /> Keluar
        </button>
        <div className="text-indigo-400 text-xs font-bold tracking-widest uppercase bg-indigo-900/20 px-3 py-1 rounded-full border border-indigo-500/20">
          {gameState.mode === GameMode.PVE ? "AI Challenger" : "Local Duel"}
        </div>
      </header>

      <GameBoard 
        history={gameState.history}
        currentTurn={gameState.currentTurn}
        timeLeft={gameState.timer}
        pendingWord={pendingWord}
        theme={gameState.theme}
        streak={gameState.streak}
      />

      <div className="mt-4 space-y-4 max-w-2xl mx-auto w-full relative z-20">
        {/* Error Message Bubble */}
        {errorMsg && (
          <div className="absolute -top-16 left-0 right-0 mx-auto w-max bg-red-500 text-white px-6 py-3 rounded-full shadow-xl animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2 font-bold z-50">
             <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
            {errorMsg}
          </div>
        )}

        {/* Status Indicator */}
        <div className="text-center h-6">
          {isLoading && !pendingWord && (
            <p className="text-indigo-400 animate-pulse text-sm font-medium">
               {gameState.currentTurn === PlayerType.AI ? "Gemini sedang berpikir..." : "Memvalidasi..."}
            </p>
          )}
          {!isLoading && (
            <p className="text-slate-400 text-sm">
               {gameState.currentTurn === PlayerType.AI 
                 ? "Giliran AI..." 
                 : (gameState.mode === GameMode.PVP_LOCAL && gameState.currentTurn === PlayerType.PLAYER_2 
                    ? "Giliran Player 2" 
                    : "Giliran Kamu")}
            </p>
          )}
        </div>

        {/* Input Area */}
        <WordInput 
          onSubmit={validateAndSubmit}
          isLoading={isLoading}
          disabled={isLoading || gameState.currentTurn === PlayerType.AI}
          requiredLetter={getRequiredLetter()}
        />
      </div>
    </div>
  );
};

export default App;
