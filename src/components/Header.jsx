export default function Header({ onNewTask, currentView }) {
  return (
    <header className="px-8 py-5 flex justify-between items-center border-b border-white/5 backdrop-blur-xl z-20 bg-[#0B0F19]/80 sticky top-0">
      <div>
        <h1 className="text-2xl font-black tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-indigo-500">
            PROACTIVE TRACKER
          </span>
        </h1>
        <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-bold mt-1 ml-1">
          Aggressive Task Management
        </p>
      </div>
      {currentView === 'board' && (
        <button
          onClick={onNewTask}
          className="bg-white text-black hover:bg-gray-100 px-6 py-2.5 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>
      )}
    </header>
  );
}
