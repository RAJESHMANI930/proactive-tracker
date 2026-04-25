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
  if (!isOpen) return null;

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
          <div>
            <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Task Title</label>
            <input
              type="text"
              autoFocus
              required
              value={task.title}
              onChange={e => onTaskChange({ title: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-medium"
              placeholder="e.g., Record Podcast"
            />
          </div>

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

          <div className="mt-2 bg-white/5 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest ml-1">Subtasks (Checklist)</label>
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
                  <button
                    type="button"
                    onClick={() => onRemoveSubtask(subtask.id)}
                    className="p-2 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {(!task.subtasks || task.subtasks.length === 0) && (
                <div className="text-center py-4">
                  <p className="text-xs text-white/30 italic">No subtasks added yet.</p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onAddSubtask}
              className="w-full py-2 border border-dashed border-white/20 rounded-xl text-xs font-bold text-white/50 hover:bg-white/5 hover:text-white/80 transition-all flex items-center justify-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Add Subtask Item
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  {editingTaskId ? 'Save Task Changes' : 'Create Task'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
