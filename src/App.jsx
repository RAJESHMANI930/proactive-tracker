import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, addDoc, serverTimestamp } from 'firebase/firestore';

function App() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', priority: 'High', deadlineStr: '' });

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

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    
    try {
      const deadlineDate = newTask.deadlineStr ? new Date(newTask.deadlineStr) : null;
      
      await addDoc(collection(db, 'tasks'), {
        title: newTask.title,
        priority: newTask.priority,
        deadline: deadlineDate, // Firestore handles JS Date objects
        status: 'Pending',
        createdAt: serverTimestamp(),
        webhookFired: false
      });
      
      setNewTask({ title: '', priority: 'High', deadlineStr: '' });
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error adding document: ", error);
      alert("Failed to create task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority?.toLowerCase()) {
      case 'top': return 'bg-red-500/20 text-red-100 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
      case 'high': return 'bg-orange-500/20 text-orange-100 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.1)]';
      case 'medium': return 'bg-blue-500/20 text-blue-100 border-blue-500/50';
      case 'low': return 'bg-gray-500/20 text-gray-100 border-gray-500/50';
      default: return 'bg-gray-500/20 text-gray-100 border-gray-500/50';
    }
  };

  const Column = ({ title, priority, items }) => (
    <div className="flex flex-col w-full md:w-1/4 h-full bg-slate-800/40 rounded-3xl border border-white/5 overflow-hidden backdrop-blur-xl shadow-xl">
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
        {items.map(task => (
          <div key={task.id} className={`p-4 rounded-2xl border backdrop-blur-md transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg cursor-pointer ${getPriorityColor(task.priority)}`}>
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-[15px] leading-tight pr-2">{task.title}</h3>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              {task.deadline ? (
                <div className={`text-xs flex items-center px-2 py-1 rounded-md bg-black/30 font-medium ${priority === 'Top' ? 'text-red-300' : 'text-white/70'}`}>
                  <svg className="w-3.5 h-3.5 mr-1.5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {new Date(task.deadline?.seconds * 1000).toLocaleString([], {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
                </div>
              ) : (
                <div className="text-xs text-white/40 italic">No deadline</div>
              )}
              
              <div className={`text-[10px] px-2 py-1 rounded-full uppercase tracking-wider font-bold ${task.status === 'Done' ? 'bg-green-500/20 text-green-300' : 'bg-white/10 text-white/60'}`}>
                {task.status || 'Pending'}
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-white/5 rounded-2xl h-32">
            <span className="text-white/20 text-sm font-medium">No tasks</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white font-sans selection:bg-indigo-500/30 overflow-hidden flex flex-col relative">
      {/* Background decoration */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/20 blur-[150px]"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-red-600/10 blur-[150px]"></div>
      </div>

      <header className="px-8 py-5 flex justify-between items-center border-b border-white/5 backdrop-blur-xl z-10 bg-[#0B0F19]/80">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-indigo-500">
              PROACTIVE TRACKER
            </span>
          </h1>
          <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] font-bold mt-1 ml-1">Aggressive Task Management</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-white text-black hover:bg-gray-100 px-6 py-2.5 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
          New Task
        </button>
      </header>

      <main className="p-8 flex-1 overflow-hidden z-10">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-6 h-full pb-4">
            <Column title="Top Priority" priority="Top" items={tasks.filter(t => t.priority?.toLowerCase() === 'top')} />
            <Column title="High Priority" priority="High" items={tasks.filter(t => t.priority?.toLowerCase() === 'high')} />
            <Column title="Medium Priority" priority="Medium" items={tasks.filter(t => t.priority?.toLowerCase() === 'medium')} />
            <Column title="Low Priority" priority="Low" items={tasks.filter(t => t.priority?.toLowerCase() === 'low')} />
          </div>
        )}
      </main>

      {/* New Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
            {/* Ambient Modal Glow */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-orange-500 to-indigo-500"></div>
            
            <div className="p-6">
              <h2 className="text-xl font-black mb-6 flex items-center justify-between">
                Add New Task
                <button onClick={() => setIsModalOpen(false)} className="text-white/30 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-2 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </h2>
              
              <form onSubmit={handleCreateTask} className="space-y-5">
                <div>
                  <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-2 ml-1">Task Title</label>
                  <input 
                    type="text" 
                    autoFocus
                    required
                    value={newTask.title} 
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-medium"
                    placeholder="e.g., Prepare Product Launch Copy"
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
                
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full mt-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      Create Task
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
