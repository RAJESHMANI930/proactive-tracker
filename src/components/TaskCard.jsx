import { getPriorityColor } from '../constants/priorities';
import { timestampToDisplay } from '../utils/dateHelpers';

export default function TaskCard({ task, onEdit, onDelete, onMarkComplete, onToggleSubtask }) {
  const subtaskCount = task.subtasks?.length || 0;
  const completedSubtasksCount = task.subtasks?.filter(s => s.isCompleted)?.length || 0;

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
      className={`p-4 rounded-2xl border backdrop-blur-md transition-transform duration-200 cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-lg ${getPriorityColor(task.priority)}`}
    >
      <div className="flex justify-between items-start mb-3 gap-2">
        <h3 className="font-bold text-[15px] leading-tight flex-1 pr-2">{task.title}</h3>
        <div className="flex gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="p-1 hover:text-indigo-300 transition-colors" title="Edit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
          <button onClick={() => onDelete(task.id)} className="p-1 hover:text-red-400 transition-colors" title="Delete">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {subtaskCount > 0 && (
        <div className="mb-3 pt-2 border-t border-white/10">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Checklist</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${completedSubtasksCount === subtaskCount ? 'bg-green-500/20 text-green-300' : 'bg-black/30 text-white/50'}`}>
              {completedSubtasksCount} / {subtaskCount}
            </span>
          </div>
          <div className="space-y-1.5 flex flex-col">
            {task.subtasks.map(subtask => (
              <label key={subtask.id} className="flex items-start gap-2 cursor-pointer group active:opacity-75">
                <div className="relative flex items-center mt-0.5">
                  <input
                    type="checkbox"
                    checked={subtask.isCompleted}
                    onChange={() => onToggleSubtask(task.id, subtask.id, task.subtasks)}
                    className="w-3.5 h-3.5 appearance-none rounded-sm border border-white/30 checked:bg-indigo-500 checked:border-indigo-500 transition-colors"
                  />
                  {subtask.isCompleted && (
                    <svg className="absolute w-2.5 h-2.5 top-[2px] left-[2px] text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs flex-1 transition-all ${subtask.isCompleted ? 'text-white/30 line-through' : 'text-white/80 group-hover:text-white'}`}>
                  {subtask.title}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 mt-3">
        <div className="flex items-center justify-between">
          {task.deadline ? (
            <div className={`text-xs flex items-center px-2 py-1 rounded-md bg-black/30 font-medium ${task.priority === 'Top' ? 'text-red-300' : 'text-white/70'}`}>
              <svg className="w-3.5 h-3.5 mr-1.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {timestampToDisplay(task.deadline)}
            </div>
          ) : (
            <div className="text-xs text-white/40 italic">No deadline</div>
          )}
          <div className="text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold bg-white/10 text-white/50">
            {task.status || 'Pending'}
          </div>
        </div>

        <button
          onClick={() => onMarkComplete(task.id)}
          className="w-full flex items-center justify-center gap-2 py-2 mt-1 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-wider transition-colors active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
          </svg>
          {subtaskCount > 0 && completedSubtasksCount !== subtaskCount ? 'Mark Done Anyway' : 'Mark as Done'}
        </button>
      </div>
    </div>
  );
}
