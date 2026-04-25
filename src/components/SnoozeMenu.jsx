const OPTIONS = [
  { label: '+1 hour', ms: 60 * 60 * 1000 },
  { label: '+3 hours', ms: 3 * 60 * 60 * 1000 },
  { label: '+1 day', ms: 24 * 60 * 60 * 1000 },
];

export default function SnoozeMenu({ onSnooze, onClose }) {
  return (
    <div className="absolute right-0 top-full mt-1 z-30 bg-[#1c2235] border border-white/10 rounded-xl shadow-xl w-36 overflow-hidden" onClick={e => e.stopPropagation()}>
      {OPTIONS.map(({ label, ms }) => (
        <button
          key={label}
          onClick={() => { onSnooze(ms); onClose(); }}
          className="w-full text-left px-4 py-2.5 text-sm text-white/70 hover:bg-white/5 transition"
        >
          {label}
        </button>
      ))}
      <button
        onClick={onClose}
        className="w-full text-left px-4 py-2.5 text-xs text-white/30 hover:bg-white/5 transition border-t border-white/5"
      >
        Cancel
      </button>
    </div>
  );
}
