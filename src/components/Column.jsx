import { PRIORITY_LABEL_COLORS } from '../constants/priorities';
import TaskCard from './TaskCard';

export default function Column({ title, priority, items, onDrop, onEditTask, onDeleteTask, onMarkComplete, onToggleSubtask }) {
  const handleDragOver = (e) => e.preventDefault();
  const handleDrop = (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) onDrop(taskId, priority);
  };

  return (
    <div
      className="flex flex-col w-full md:w-1/4 h-[calc(100vh-280px)] min-h-[400px] bg-slate-800/40 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-xl shadow-xl transition-colors duration-200"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className={`p-5 border-b border-white/10 font-black uppercase tracking-widest text-sm flex justify-between items-center bg-white/5 ${PRIORITY_LABEL_COLORS[priority] || 'text-gray-400'}`}>
        <div className="flex items-center gap-2">
          {priority === 'Top' && (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
          {title}
        </div>
        <span className="bg-black/40 px-3 py-1 rounded-full text-xs text-white/80">{items.length}</span>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
        {items.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onMarkComplete={onMarkComplete}
            onToggleSubtask={onToggleSubtask}
          />
        ))}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-white/5 rounded-2xl h-32">
            <span className="text-white/20 text-sm font-medium">Drag tasks here</span>
          </div>
        )}
      </div>
    </div>
  );
}
