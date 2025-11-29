
import React, { useEffect, useRef } from 'react';
import { WordEntry, PlayerType, GameTheme } from '../types';
import { Bot, User, Clock, Loader2, Tag, Flame, ArrowDown } from 'lucide-react';

interface GameBoardProps {
  history: WordEntry[];
  currentTurn: PlayerType;
  timeLeft: number;
  pendingWord: string | null;
  theme: GameTheme;
  streak: number;
}

export const GameBoard: React.FC<GameBoardProps> = ({ history, currentTurn, timeLeft, pendingWord, theme, streak }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, pendingWord]);

  const lastEntry = history.length > 0 ? history[history.length - 1] : null;
  const lastLetter = lastEntry ? lastEntry.word.slice(-1).toUpperCase() : null;

  const getPlayerIcon = (type: PlayerType) => {
    if (type === PlayerType.AI) return <Bot size={16} />;
    return <User size={16} />;
  };

  const getTurnColor = (type: PlayerType) => {
      if (type === PlayerType.AI) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      if (type === PlayerType.PLAYER_2) return "text-pink-400 border-pink-500/30 bg-pink-500/10";
      return "text-indigo-400 border-indigo-500/30 bg-indigo-500/10";
  }

  return (
    <div className="flex flex-col flex-1 w-full max-w-2xl mx-auto relative">
      
      {/* TOP STATUS BAR: Streak & Timer */}
      <div className="flex justify-between items-center mb-4 z-20">
         {/* Theme Pill */}
         <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700">
             <Tag size={14} className="text-indigo-400" />
             <span className="text-xs font-bold text-slate-300 uppercase">{theme}</span>
         </div>

         {/* Timer */}
         <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border font-mono font-bold text-lg transition-colors duration-300 ${timeLeft <= 10 ? 'bg-red-500/20 text-red-400 border-red-500' : 'bg-slate-800 border-slate-700 text-slate-200'}`}>
            <Clock size={16} /> {timeLeft}s
         </div>

         {/* Streak Counter */}
         <div className="flex items-center gap-2 bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/30">
            <Flame size={16} className="text-orange-500 fill-orange-500" />
            <span className="text-sm font-bold text-orange-200">{streak} Streak</span>
         </div>
      </div>

      {/* BACKGROUND HISTORY LIST (Subtle) */}
      <div className="absolute inset-x-0 top-12 bottom-1/2 pointer-events-none opacity-20 mask-linear-fade z-0 flex flex-col justify-end items-center pb-8 space-y-2">
         {history.slice(-6, -1).map((entry) => (
             <div key={entry.id} className="text-2xl font-bold text-slate-500 blur-[1px] select-none">
                 {entry.word}
             </div>
         ))}
      </div>

      {/* MAIN ARENA (Center Stage) */}
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 min-h-[300px]">
        
        {/* If no words yet */}
        {history.length === 0 && !pendingWord && (
            <div className="text-center animate-in zoom-in fade-in duration-500">
                <div className="text-6xl mb-4 opacity-20">🎮</div>
                <h2 className="text-3xl font-bold text-white mb-2">Mulai Game!</h2>
                <p className="text-slate-400">Ketik kata pertama (sesuai tema) untuk memulai.</p>
            </div>
        )}

        {/* The Pending/Processing Word */}
        {pendingWord && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-50 rounded-3xl">
                <div className="bg-slate-800 border border-indigo-500 p-6 rounded-2xl shadow-2xl flex flex-col items-center animate-pulse">
                    <Loader2 size={32} className="animate-spin text-indigo-400 mb-2"/>
                    <div className="text-2xl font-bold text-white">{pendingWord}</div>
                    <div className="text-xs text-indigo-300 mt-1">Checking...</div>
                </div>
            </div>
        )}

        {/* The LAST PLAYED WORD (Hero) */}
        {lastEntry && (
             <div className="relative animate-in zoom-in duration-300 w-full flex flex-col items-center">
                 {/* Player Label above word */}
                 <div className={`mb-3 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getTurnColor(lastEntry.player)}`}>
                    {getPlayerIcon(lastEntry.player)}
                    {lastEntry.player === PlayerType.AI ? 'Gemini AI' : (lastEntry.player === PlayerType.PLAYER_1 ? 'Kamu' : 'Player 2')}
                 </div>

                 {/* The Word Card */}
                 <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-600 px-10 py-6 rounded-3xl shadow-2xl relative group">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight capitalize">
                        {lastEntry.word.slice(0, -1)}
                        <span className="text-slate-400 group-hover:text-indigo-400 transition-colors">{lastEntry.word.slice(-1)}</span>
                    </h1>
                 </div>
             </div>
        )}

        {/* CONNECTION LINE */}
        {lastLetter && (
            <div className="h-12 w-0.5 bg-gradient-to-b from-slate-600 to-indigo-500 my-2"></div>
        )}

        {/* NEXT LETTER INDICATOR */}
        {lastLetter && (
            <div className="flex flex-col items-center animate-in slide-in-from-top-4 duration-500">
                <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl shadow-[0_0_30px_rgba(79,70,229,0.3)] flex items-center justify-center text-5xl font-extrabold text-white border-4 border-slate-900 ring-2 ring-indigo-500/50">
                        {lastLetter}
                    </div>
                    {/* Pulsing effect */}
                    <div className="absolute -inset-1 bg-indigo-500 rounded-2xl opacity-20 animate-ping"></div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-indigo-300 text-sm font-medium bg-indigo-900/20 px-3 py-1 rounded-lg border border-indigo-500/20">
                    <ArrowDown size={14} className="animate-bounce" />
                    Mulai dengan huruf ini
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
