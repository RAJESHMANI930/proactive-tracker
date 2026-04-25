import { useState } from 'react';
import { db } from './firebase';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp,
} from 'firebase/firestore';

import { useTasks } from './hooks/useTasks';
import { timestampToDatetimeLocal } from './utils/dateHelpers';

import Header from './components/Header';
import BottomNav from './components/BottomNav';
import Column from './components/Column';
import TaskModal from './components/TaskModal';
import SettingsPage from './components/SettingsPage';

const EMPTY_TASK = { title: '', priority: 'High', deadlineStr: '', subtasks: [] };
const DONE_STATUSES = ['Completed', 'Done', 'Skipped', 'Incomplete'];

function App() {
  const { tasks, loading } = useTasks();
  const [currentView, setCurrentView] = useState('board');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTask, setNewTask] = useState(EMPTY_TASK);
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(true);

  const openNewTaskModal = () => {
    setEditingTaskId(null);
    setNewTask(EMPTY_TASK);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTaskId(task.id);
    setNewTask({
      title: task.title,
      priority: task.priority,
      deadlineStr: timestampToDatetimeLocal(task.deadline),
      subtasks: task.subtasks || [],
    });
    setIsModalOpen(true);
  };

  const handleTaskChange = (updates) => setNewTask(prev => ({ ...prev, ...updates }));

  const handleAddSubtask = () => {
    setNewTask(prev => ({
      ...prev,
      subtasks: [...(prev.subtasks || []), { id: Date.now().toString(), title: '', isCompleted: false }],
    }));
  };

  const handleSubtaskTitleChange = (id, title) => {
    setNewTask(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(s => s.id === id ? { ...s, title } : s),
    }));
  };

  const handleRemoveSubtask = (id) => {
    setNewTask(prev => ({ ...prev, subtasks: prev.subtasks.filter(s => s.id !== id) }));
  };

  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || isSubmitting) return;
    const cleanedSubtasks = (newTask.subtasks || []).filter(s => s.title.trim() !== '');
    setIsSubmitting(true);
    try {
      const deadlineDate = newTask.deadlineStr ? new Date(newTask.deadlineStr) : null;
      if (editingTaskId) {
        await updateDoc(doc(db, 'tasks', editingTaskId), {
          title: newTask.title,
          priority: newTask.priority,
          deadline: deadlineDate,
          subtasks: cleanedSubtasks,
        });
      } else {
        await addDoc(collection(db, 'tasks'), {
          title: newTask.title,
          priority: newTask.priority,
          deadline: deadlineDate,
          subtasks: cleanedSubtasks,
          status: 'Pending',
          userId: 'default',
          category: null,
          tags: [],
          isRecurring: false,
          recurrencePattern: null,
          pomodoroCount: 0,
          snoozedUntil: null,
          completedAt: null,
          skippedAt: null,
          createdAt: serverTimestamp(),
          webhookFired: false,
          remindersSent: { whatsappSent: false, telegramSent: false, missedFollowup: false },
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving task:', err);
      alert('Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkComplete = async (taskId) => {
    await updateDoc(doc(db, 'tasks', taskId), { status: 'Completed', completedAt: new Date() });
  };

  const handleRestoreTask = async (taskId) => {
    await updateDoc(doc(db, 'tasks', taskId), {
      status: 'Pending',
      completedAt: null,
      skippedAt: null,
      webhookFired: false,
      remindersSent: { whatsappSent: false, telegramSent: false, missedFollowup: false },
    });
  };

  const handleToggleSubtask = async (taskId, subtaskId, currentSubtasks) => {
    const updatedSubtasks = currentSubtasks.map(s =>
      s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    await updateDoc(doc(db, 'tasks', taskId), { subtasks: updatedSubtasks });
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to permanently delete this task?')) {
      await deleteDoc(doc(db, 'tasks', taskId));
    }
  };

  const handleDrop = async (taskId, targetPriority) => {
    await updateDoc(doc(db, 'tasks', taskId), { priority: targetPriority });
  };

  const pendingTasks = tasks.filter(t => !DONE_STATUSES.includes(t.status));
  const completedTasks = tasks.filter(t => DONE_STATUSES.includes(t.status));

  const columnProps = {
    onDrop: handleDrop,
    onEditTask: openEditModal,
    onDeleteTask: handleDeleteTask,
    onMarkComplete: handleMarkComplete,
    onToggleSubtask: handleToggleSubtask,
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col relative">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-red-600/10 blur-[150px]"></div>
      </div>

      <Header onNewTask={openNewTaskModal} currentView={currentView} />

      <main className="flex-1 overflow-y-auto z-10 custom-scrollbar pb-20">

        {/* Board View */}
        {currentView === 'board' && (
          <div className="p-8">
            {loading ? (
              <div className="flex items-center justify-center h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                <div className="flex flex-col md:flex-row gap-6">
                  <Column title="Top Priority" priority="Top" items={pendingTasks.filter(t => t.priority?.toLowerCase() === 'top')} {...columnProps} />
                  <Column title="High Priority" priority="High" items={pendingTasks.filter(t => t.priority?.toLowerCase() === 'high')} {...columnProps} />
                  <Column title="Medium Priority" priority="Medium" items={pendingTasks.filter(t => t.priority?.toLowerCase() === 'medium')} {...columnProps} />
                  <Column title="Low Priority" priority="Low" items={pendingTasks.filter(t => t.priority?.toLowerCase() === 'low')} {...columnProps} />
                </div>

                {completedTasks.length > 0 && (
                  <div className="mt-4 pt-6 border-t border-white/10">
                    <button
                      onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                      className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="text-xl font-bold text-white/80">Completed / Skipped Tasks</h2>
                        <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-white/50">{completedTasks.length}</span>
                      </div>
                      <svg className={`w-5 h-5 text-white/50 transform transition-transform duration-300 ${isCompletedExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {isCompletedExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                        {completedTasks.map(task => (
                          <div key={task.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 opacity-60 hover:opacity-100 flex items-center justify-between group relative transition-opacity">
                            <div className="flex-1 pr-16 line-through decoration-white/30 decoration-2">
                              <p className="text-sm font-bold text-white/70 truncate" title={task.title}>{task.title}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] uppercase tracking-widest text-white/30">{task.priority} Priority</p>
                                {task.status === 'Skipped' && (
                                  <span className="text-[9px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded uppercase font-bold">Skipped</span>
                                )}
                                {task.status === 'Incomplete' && (
                                  <span className="text-[9px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded uppercase font-bold">Incomplete</span>
                                )}
                              </div>
                            </div>
                            <div className="absolute right-4 flex gap-2">
                              <button onClick={() => handleRestoreTask(task.id)} className="p-1.5 text-indigo-300 opacity-50 hover:bg-indigo-500/20 rounded-lg hover:opacity-100 hover:scale-110 transition-all" title="Restore Task">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                              </button>
                              <button onClick={() => handleDeleteTask(task.id)} className="p-1.5 text-red-400 opacity-50 hover:bg-red-500/20 rounded-lg hover:opacity-100 hover:scale-110 transition-all" title="Delete Task">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dashboard stub */}
        {currentView === 'dashboard' && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-xl font-black text-white mb-2">Dashboard — Coming Soon</h2>
            <p className="text-sm text-white/40 max-w-xs">Stats, streaks, and completion rates are coming in Phase 3.</p>
          </div>
        )}

        {/* Calendar stub */}
        {currentView === 'calendar' && (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6">
            <div className="text-6xl mb-4">📅</div>
            <h2 className="text-xl font-black text-white mb-2">Calendar — Coming Soon</h2>
            <p className="text-sm text-white/40 max-w-xs">Monthly task view is coming in Phase 3.</p>
          </div>
        )}

        {/* Settings */}
        {currentView === 'settings' && <SettingsPage />}
      </main>

      <BottomNav currentView={currentView} onNavigate={setCurrentView} />

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdateTask}
        editingTaskId={editingTaskId}
        task={newTask}
        onTaskChange={handleTaskChange}
        onAddSubtask={handleAddSubtask}
        onSubtaskTitleChange={handleSubtaskTitleChange}
        onRemoveSubtask={handleRemoveSubtask}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

export default App;
