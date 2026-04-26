import { useRef, useState } from 'react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function VoiceButton({ onTranscript }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  if (!supported) return null;

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = e => onTranscript(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.start();
    recRef.current = rec;
    setListening(true);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className={`p-2 rounded-xl transition ${listening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10'}`}
      title={listening ? 'Stop listening' : 'Voice input'}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    </button>
  );
}

export default function TaskModal({
  isOpen,
  onClose,
  onSubmit,
  editingTaskId,
  task,
  onTaskChange,
  onAddSubtask,
  onSubtaskTitleChange,
  onRemoveSubtask,
  isSubmitting,
}) {
  const [tagInput, setTagInput] = useState('');

  if (!isOpen) return null;

  const addTag = (raw) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, '-');
    if (!tag) return;
    const current = task.tags || [];
    if (!current.includes(tag)) onTaskChange({ tags: [...current, tag] });
    setTagInput('');
  };

  const removeTag = (tag) => onTaskChange({ tags: (task.tags || []).filter(t => t !== tag) });

  const toggleRecurDay = (idx) => {
    const days = task.recurrenceDays || [];
    onTaskChange({ recurrenceDays: days.includes(idx) ? days.filter(d => d !== idx) : [...days, idx] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

        <div className="p-6 pb-2 border-b border-white/5">
          <h2 className="text-xl font-black flex items-center justify-between">
            {editingTaskId ? 'Edit Task' : 'Add New Task'}
            <button onClick={onClose} className="text-white/30 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </h2>
        </div>

        <form onSubmit={onSubmit} className="p-6 pt-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5">
          {/* Title + voice */}
          <div>
            <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Task Title</label>
            <div className="flex gap-2">
              <input
                type="text"
                autoFocus
                required
                value={task.title}
                onChange={e => onTaskChange({ title: e.target.value })}
                className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-medium"
                placeholder="e.g., Record Podcast"
              />
              <VoiceButton onTranscript={t => onTaskChange({ title: t })} />
            </div>
          </div>

          {/* Priority + Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Priority</label>
              <div className="relative">
                <select
                  value={task.priority}
                  onChange={e => onTaskChange({ priority: e.target.value })}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none text-sm font-bold cursor-pointer transition-all"
                >
                  <option value="Top">🔴 Top</option>
                  <option value="High">🟠 High</option>
                  <option value="Medium">🔵 Medium</option>
                  <option value="Low">⚪ Low</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/50">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Deadline</label>
              <input
                type="datetime-local"
                value={task.deadlineStr}
                onChange={e => onTaskChange({ deadlineStr: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:[color-scheme:dark] text-sm font-medium transition-all"
              />
            </div>
          </div>

          {/* Category + Tags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Category</label>
              <input
                type="text"
                value={task.category || ''}
                onChange={e => onTaskChange({ category: e.target.value || null })}
                placeholder="e.g., Work"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Tags</label>
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); } }}
                onBlur={() => addTag(tagInput)}
                placeholder="Type + Enter"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-sm transition-all"
              />
            </div>
          </div>
          {(task.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 -mt-2">
              {task.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-violet-600/20 border border-violet-500/30 text-violet-300 text-[11px] px-2 py-0.5 rounded-full">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="text-violet-400/60 hover:text-violet-300">✕</button>
                </span>
              ))}
            </div>
          )}

          {/* Recurring */}
          <div className="bg-white/5 rounded-2xl border border-white/5 p-4 flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input type="checkbox" checked={!!task.isRecurring} onChange={e => onTaskChange({ isRecurring: e.target.checked, recurrencePattern: e.target.checked ? 'daily' : null })} className="sr-only peer" />
                <div className="w-9 h-5 rounded-full bg-white/10 peer-checked:bg-indigo-600 transition-colors" />
                <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-all peer-checked:left-4" />
              </div>
              <span className="text-sm font-semibold text-white/70">Recurring task</span>
            </label>
            {task.isRecurring && (
              <div className="flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200">
                <div className="flex gap-2">
                  {['daily', 'weekly'].map(p => (
                    <button
                      type="button"
                      key={p}
                      onClick={() => onTaskChange({ recurrencePattern: p })}
                      className={`flex-1 py-2 rounded-xl text-sm font-bold transition ${task.recurrencePattern === p ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
                {task.recurrencePattern === 'weekly' && (
                  <div className="flex gap-1">
                    {WEEKDAYS.map((d, i) => (
                      <button
                        type="button"
                        key={d}
                        onClick={() => toggleRecurDay(i)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition ${(task.recurrenceDays || []).includes(i) ? 'bg-indigo-600 text-white' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                      >
                        {d[0]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Subtasks */}
          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest ml-1">Subtasks</label>
              <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-md text-white/50">{task.subtasks?.length || 0} items</span>
            </div>
            <div className="space-y-2 mb-3 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
              {(task.subtasks || []).map((subtask, index) => (
                <div key={subtask.id} className="flex items-center gap-2 group animate-in slide-in-from-left-2 duration-200">
                  <div className="text-white/20 text-[10px] w-4 text-center">{index + 1}.</div>
                  <input
                    type="text"
                    value={subtask.title}
                    onChange={e => onSubtaskTitleChange(subtask.id, e.target.value)}
                    placeholder="e.g., Research guest"
                    className="flex-1 bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 transition-all text-sm"
                  />
                  <button type="button" onClick={() => onRemoveSubtask(subtask.id)} className="p-2 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              {(!task.subtasks || task.subtasks.length === 0) && (
                <p className="text-center py-4 text-xs text-white/30 italic">No subtasks added yet.</p>
              )}
            </div>
            <button type="button" onClick={onAddSubtask} className="w-full py-2 border border-dashed border-white/20 rounded-xl text-xs font-bold text-white/50 hover:bg-white/5 hover:text-white/80 transition-all flex items-center justify-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
              Add Subtask
            </button>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  {editingTaskId ? 'Save Changes' : 'Create Task'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
