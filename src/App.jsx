import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, addDoc, updateDoc, doc, serverTimestamp, deleteDoc } from 'firebase/firestore';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [newTask, setNewTask] = useState({ 
    title: '', 
    priority: 'High', 
    deadlineStr: '',
    subtasks: [] 
  });

  // UI State
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(true);

  useEffect(() => {
    // Listen to real-time updates from Firestore
    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort in-memory to avoid needing composite indexes right away for development
      taskData.sort((a, b) => {
        if (!a.deadline || !b.deadline) return 0;
        return a.deadline.seconds - b.deadline.seconds;
      });
      
      setTasks(taskData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const openNewTaskModal = () => {
    setEditingTaskId(null);
    setNewTask({ title: '', priority: 'High', deadlineStr: '', subtasks: [] });
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    let deadlineStr = '';
    if (task.deadline) {
      // Localize the timestamp specifically for datetime-local
      const date = new Date(task.deadline.seconds * 1000);
      const tzOffset = date.getTimezoneOffset() * 60000;
      deadlineStr = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    }
    
    setEditingTaskId(task.id);
    setNewTask({
      title: task.title,
      priority: task.priority,
      deadlineStr,
      subtasks: task.subtasks || []
    });
    setIsModalOpen(true);
  };

  // Subtask UI Handlers
  const handleAddSubtask = () => {
    setNewTask({
      ...newTask,
      subtasks: [...(newTask.subtasks || []), { id: Date.now().toString(), title: '', isCompleted: false }]
    });
  };

  const handleSubtaskTitleChange = (id, newTitle) => {
    setNewTask({
      ...newTask,
      subtasks: (newTask.subtasks || []).map(s => s.id === id ? { ...s, title: newTitle } : s)
    });
  };

  const handleRemoveSubtask = (id) => {
    setNewTask({
      ...newTask,
      subtasks: (newTask.subtasks || []).filter(s => s.id !== id)
    });
  };

  const handleCreateOrUpdateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || isSubmitting) return;

    // Filter out completely empty subtasks before saving
    const cleanedSubtasks = (newTask.subtasks || []).filter(s => s.title.trim() !== '');

    setIsSubmitting(true);
    
    try {
      const deadlineDate = newTask.deadlineStr ? new Date(newTask.deadlineStr) : null;
      
      if (editingTaskId) {
        await updateDoc(doc(db, 'tasks', editingTaskId), {
          title: newTask.title,
          priority: newTask.priority,
          deadline: deadlineDate,
          subtasks: cleanedSubtasks
        });
      } else {
        await addDoc(collection(db, 'tasks'), {
          title: newTask.title,
          priority: newTask.priority,
          deadline: deadlineDate,
          subtasks: cleanedSubtasks,
          status: 'Pending',
          createdAt: serverTimestamp(),
          webhookFired: false
        });
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving document: ", error);
      alert("Failed to save task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkComplete = async (taskId) => {
    try {
      await updateDoc(doc(db, 'tasks', taskId), { status: 'Completed' });
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleRestoreTask = async (taskId) => {
    try {
      // Revert status to 'Pending' returning it back to its original priority column
      await updateDoc(doc(db, 'tasks', taskId), { status: 'Pending' });
    } catch (error) {
      console.error("Error restoring document: ", error);
    }
  };

  const handleToggleSubtask = async (taskId, subtaskId, currentSubtasks) => {
    try {
      const updatedSubtasks = currentSubtasks.map(s => 
        s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
      );
      await updateDoc(doc(db, 'tasks', taskId), { subtasks: updatedSubtasks });
    } catch (error) {
      console.error("Error toggling subtask: ", error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm("Are you sure you want to completely delete this task?")) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
      } catch (error) {
        console.error("Error deleting document: ", error);
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetPriority) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      try {
        await updateDoc(doc(db, 'tasks', taskId), { priority: targetPriority });
      } catch (error) {
        console.error("Error moving document: ", error);
      }
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'Completed' && t.status !== 'Done');
  const completedTasks = tasks.filter(t => t.status === 'Completed' || t.status === 'Done');

  const getPriorityColor = (priority, isCompleted) => {
    if (isCompleted) return 'bg-white/5 text-white/40 border-white/10 grayscale opacity-60 hover:opacity-100 transition-opacity';
    
    switch(priority?.toLowerCase()) {
      case 'top': return 'bg-red-500/20 text-red-100 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
      case 'high': return 'bg-orange-500/20 text-orange-100 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.1)]';
      case 'medium': return 'bg-blue-500/20 text-blue-100 border-blue-500/50';
      case 'low': return 'bg-gray-500/20 text-gray-100 border-gray-500/50';
      default: return 'bg-gray-500/20 text-gray-100 border-gray-500/50';
    }
  };

  const Column = ({ title, priority, items }) => (
    <div 
      className="flex flex-col w-full md:w-1/4 h-[calc(100vh-280px)] min-h-[400px] bg-slate-800/40 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-xl shadow-xl transition-colors duration-200"
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, priority)}
    >
      <div className={`p-5 border-b border-white/10 font-black uppercase tracking-widest text-sm flex justify-between items-center bg-white/5 ${
        priority === 'Top' ? 'text-red-400' : 
        priority === 'High' ? 'text-orange-400' : 
        priority === 'Medium' ? 'text-blue-400' : 'text-gray-400'
      }`}>
        <div className="flex items-center gap-2">
          {priority === 'Top' && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
          {title}
        </div>
        <span className="bg-black/40 px-3 py-1 rounded-full text-xs text-white/80">{items.length}</span>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-4 custom-scrollbar">
        {items.map(task => {
          const subtaskCount = task.subtasks?.length || 0;
          const completedSubtasksCount = task.subtasks?.filter(s => s.isCompleted)?.length || 0;
          
          return (
            <div 
              key={task.id} 
              draggable
              onDragStart={(e) => handleDragStart(e, task.id)}
              className={`p-4 rounded-2xl border backdrop-blur-md transition-transform duration-200 cursor-grab active:cursor-grabbing hover:-translate-y-1 hover:shadow-lg ${getPriorityColor(task.priority, false)}`}
            >
              <div className="flex justify-between items-start mb-3 gap-2">
                <h3 className="font-bold text-[15px] leading-tight flex-1 pr-2">{task.title}</h3>
                {/* Actions */}
                <div className="flex gap-1.5 opacity-50 hover:opacity-100 transition-opacity">
                  <button onClick={() => openEditModal(task)} className="p-1 hover:text-indigo-300 transition-colors" title="Edit">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                  </button>
                  <button onClick={() => handleDeleteTask(task.id)} className="p-1 hover:text-red-400 transition-colors" title="Delete">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </button>
                </div>
              </div>
              
              {/* Checklist UI */}
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
                             onChange={() => handleToggleSubtask(task.id, subtask.id, task.subtasks)}
                             className="w-3.5 h-3.5 appearance-none rounded-sm border border-white/30 checked:bg-indigo-500 checked:border-indigo-500 transition-colors"
                           />
                           {subtask.isCompleted && (
                             <svg className="absolute w-2.5 h-2.5 top-[2px] left-[2px] text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
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
                    <div className={`text-xs flex items-center px-2 py-1 rounded-md bg-black/30 font-medium ${priority === 'Top' ? 'text-red-300' : 'text-white/70'}`}>
                      <svg className="w-3.5 h-3.5 mr-1.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      {new Date(task.deadline?.seconds * 1000).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                    </div>
                  ) : (
                    <div className="text-xs text-white/40 italic">No deadline</div>
                  )}
                  
                  <div className="text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold bg-white/10 text-white/50">
                    {task.status || 'Pending'}
                  </div>
                </div>

                {/* Mark as Done Button */}
                <button 
                  onClick={() => handleMarkComplete(task.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 mt-1 rounded-xl bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-wider transition-colors active:scale-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                  {subtaskCount > 0 && completedSubtasksCount !== subtaskCount ? 'Mark Done Anyway' : 'Mark as Done'}
                </button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-white/5 rounded-2xl h-32">
            <span className="text-white/20 text-sm font-medium">Drag tasks here</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col relative">
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-red-600/10 blur-[150px]"></div>
      </div>

      <header className="px-8 py-5 flex justify-between items-center border-b border-white/5 backdrop-blur-xl z-20 bg-[#0B0F19]/80 sticky top-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-indigo-500">
              PROACTIVE TRACKER
            </span>
          </h1>
          <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-bold mt-1 ml-1">Aggressive Task Management</p>
        </div>
        <button 
          onClick={openNewTaskModal}
          className="bg-white text-black hover:bg-gray-100 px-6 py-2.5 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
          New Task
        </button>
      </header>

      <main className="flex-1 overflow-y-auto z-10 custom-scrollbar pb-12">
        <div className="p-8">
          {loading ? (
            <div className="flex items-center justify-center h-[50vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-8">
              
              {/* PRIMARY DASHBOARD (PENDING TASKS) */}
              <div className="flex flex-col md:flex-row gap-6">
                <Column title="Top Priority" priority="Top" items={pendingTasks.filter(t => t.priority?.toLowerCase() === 'top')} />
                <Column title="High Priority" priority="High" items={pendingTasks.filter(t => t.priority?.toLowerCase() === 'high')} />
                <Column title="Medium Priority" priority="Medium" items={pendingTasks.filter(t => t.priority?.toLowerCase() === 'medium')} />
                <Column title="Low Priority" priority="Low" items={pendingTasks.filter(t => t.priority?.toLowerCase() === 'low')} />
              </div>

              {/* COMPLETED TASKS COLLAPSIBLE SECTION */}
              {completedTasks.length > 0 && (
                <div className="mt-4 pt-6 border-t border-white/10">
                  <button 
                    onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
                    className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <h2 className="text-xl font-bold text-white/80">Completed Tasks</h2>
                      <span className="bg-white/10 px-3 py-1 rounded-full text-xs font-bold text-white/50">{completedTasks.length}</span>
                    </div>
                    <svg className={`w-5 h-5 text-white/50 transform transition-transform duration-300 ${isCompletedExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </button>
                  
                  {isCompletedExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 animate-in slide-in-from-top-4 fade-in duration-300">
                      {completedTasks.map(task => (
                        <div key={task.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 opacity-60 hover:opacity-100 flex items-center justify-between group relative transition-opacity">
                           <div className="flex-1 pr-16 line-through decoration-white/30 decoration-2">
                            <p className="text-sm font-bold text-white/70 truncate" title={task.title}>{task.title}</p>
                            <p className="text-[10px] uppercase tracking-widest text-white/30 mt-1">{task.priority} Priority</p>
                          </div>
                          
                          {/* Completed Card Actions */}
                          <div className="absolute right-4 flex gap-2">
                            <button 
                              onClick={() => handleRestoreTask(task.id)} 
                              className="p-1.5 text-indigo-300 opacity-50 hover:bg-indigo-500/20 rounded-lg hover:opacity-100 hover:scale-110 transition-all cursor-pointer" 
                              title="Restore Task to Active Board"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path></svg>
                            </button>
                            <button 
                              onClick={() => handleDeleteTask(task.id)} 
                              className="p-1.5 text-red-400 opacity-50 hover:bg-red-500/20 rounded-lg hover:opacity-100 hover:scale-110 transition-all cursor-pointer" 
                              title="Delete Completed Task"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
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
      </main>

      {/* New/Edit Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden transform transition-all animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            {/* Ambient Modal Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
            
            <div className="p-6 pb-2 border-b border-white/5">
              <h2 className="text-xl font-black flex items-center justify-between">
                {editingTaskId ? 'Edit Task' : 'Add New Task'}
                <button onClick={() => setIsModalOpen(false)} className="text-white/30 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </h2>
            </div>
              
            <form onSubmit={handleCreateOrUpdateTask} className="p-6 pt-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-5">
              
              <div>
                <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Task Title</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newTask.title} 
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-medium"
                  placeholder="e.g., Record Podcast"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Priority</label>
                  <div className="relative">
                    <select 
                      value={newTask.priority}
                      onChange={e => setNewTask({...newTask, priority: e.target.value})}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none text-sm font-bold cursor-pointer transition-all"
                    >
                      <option value="Top">🔴 Top</option>
                      <option value="High">🟠 High</option>
                      <option value="Medium">🔵 Medium</option>
                      <option value="Low">⚪ Low</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-white/50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Deadline</label>
                  <input 
                    type="datetime-local" 
                    value={newTask.deadlineStr}
                    onChange={e => setNewTask({...newTask, deadlineStr: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:[color-scheme:dark] text-sm font-medium transition-all"
                  />
                </div>
              </div>

              {/* Checklist Array UI */}
              <div className="mt-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest ml-1">Subtasks (Checklist)</label>
                  <span className="text-[10px] bg-black/30 px-2 py-0.5 rounded-md text-white/50">{newTask.subtasks?.length || 0} items</span>
                </div>
                
                <div className="space-y-2 mb-3 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                  {(newTask.subtasks || []).map((subtask, index) => (
                    <div key={subtask.id} className="flex items-center gap-2 group animate-in slide-in-from-left-2 duration-200">
                      <div className="text-white/20 text-[10px] w-4 text-center">{index + 1}.</div>
                      <input 
                        type="text"
                        value={subtask.title}
                        onChange={(e) => handleSubtaskTitleChange(subtask.id, e.target.value)}
                        placeholder="e.g., Research guest"
                        className="flex-1 bg-black/20 border border-white/5 rounded-xl px-3 py-2 text-white placeholder-white/20 focus:outline-none focus:bg-black/40 focus:border-indigo-500/50 transition-all text-sm"
                      />
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSubtask(subtask.id)}
                        className="p-2 text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </div>
                  ))}
                  {(!newTask.subtasks || newTask.subtasks.length === 0) && (
                    <div className="text-center py-4">
                      <p className="text-xs text-white/30 italic">No subtasks added yet.</p>
                    </div>
                  )}
                </div>

                <button 
                  type="button" 
                  onClick={handleAddSubtask}
                  className="w-full py-2 border border-dashed border-white/20 rounded-xl text-xs font-bold text-white/50 hover:bg-white/5 hover:text-white/80 transition-all flex items-center justify-center gap-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
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
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      {editingTaskId ? 'Save Task Changes' : 'Create Task'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
