import { db } from './lib/firebase-admin.js';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

function validateSecret(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // Reject if CRON_SECRET not configured
  return req.headers['x-cron-secret'] === secret;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  if (!validateSecret(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date();
    const snapshot = await getDocs(
      query(collection(db, 'tasks'), where('status', '==', 'Pending'))
    );

    const updates = [];

    snapshot.forEach(document => {
      const task = document.data();
      if (!task.deadline) return;

      const deadlineDate = new Date(task.deadline.seconds * 1000);
      if (deadlineDate >= now) return; // Not yet overdue

      const subtasks = task.subtasks || [];
      const totalSubtasks = subtasks.length;
      const completedSubtasks = subtasks.filter(s => s.isCompleted).length;

      // All subtasks done but user hasn't clicked "Mark as Done" — leave for user
      if (totalSubtasks > 0 && completedSubtasks === totalSubtasks) return;

      const newStatus = (totalSubtasks === 0 || completedSubtasks === 0) ? 'Skipped' : 'Incomplete';
      updates.push({ id: document.id, status: newStatus });
    });

    for (const { id, status } of updates) {
      await updateDoc(doc(db, 'tasks', id), {
        status,
        ...(status === 'Skipped' ? { skippedAt: new Date() } : {}),
      });
    }

    return res.status(200).json({
      success: true,
      updated: updates.length,
      tasks: updates,
    });
  } catch (error) {
    console.error('update-statuses error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
