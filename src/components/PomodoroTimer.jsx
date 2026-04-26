import { usePomodoro } from '../hooks/usePomodoro';

export default function PomodoroTimer({ task, onSessionComplete, onClose }) {
  const { phase, display, isRunning, isBreak, start, pause, reset } = usePomodoro(onSessionComplete);

  const statusColor = isBreak ? 'text-green-400' : phase === 'idle' ? 'text-white/40' : 'text-indigo-400';
  const statusLabel = isBreak ? 'Break' : phase === 'idle' ? 'Ready' : 'Focus';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-[#141926] border border-white/10 rounded-2xl p-6 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/30">Pomodoro</p>
            <p className="text-sm font-semibold text-white mt-0.5 line-clamp-1">{task.title}</p>
          </div>
          <span className="text-xs font-bold bg-white/5 px-2 py-1 rounded-lg text-white/40">
            #{task.pomodoroCount || 0}
          </span>
        </div>

        <div className="flex flex-col items-center gap-2">
          <p className={`text-5xl font-black tabular-nums ${statusColor}`}>{display}</p>
          <p className={`text-xs uppercase tracking-widest ${statusColor}`}>{statusLabel}</p>
        </div>

        <div className="flex gap-3">
          {phase === 'idle' ? (
            <button onClick={start} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition">
              Start Focus
            </button>
          ) : (
            <button onClick={pause} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition">
              {isRunning ? 'Pause' : 'Resume'}
            </button>
          )}
          <button onClick={reset} className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition text-white/50">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
