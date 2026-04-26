import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskData = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by deadline ascending; tasks without deadlines go last
      taskData.sort((a, b) => {
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return a.deadline.seconds - b.deadline.seconds;
      });
      setTasks(taskData);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { tasks, loading };
}
