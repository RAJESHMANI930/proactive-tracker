import { db } from './lib/firebase-admin.js';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { getDeadlineWindows, isInDeadlineWindow } from './lib/timeWindows.js';
import { notify } from './lib/notifications.js';

function validateSecret(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // Dev mode: no secret configured
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
    const windows = getDeadlineWindows();

    const snapshot = await getDocs(
      query(
        collection(db, 'tasks'),
        where('status', '==', 'Pending'),
        where('webhookFired', '==', false)
      )
    );

    const tasksToNotify = [];
    snapshot.forEach(document => {
      const task = document.data();
      if (task.priority !== 'Top' && task.priority !== 'High') return;
      if (!task.deadline) return;
      if (!isInDeadlineWindow(task.deadline.seconds, windows)) return;
      tasksToNotify.push({ id: document.id, ...task });
    });

    if (tasksToNotify.length === 0) {
      return res.status(200).json({ success: true, message: 'No urgent tasks in deadline window.' });
    }

    // Load user settings for notification channels
    let settings = {};
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'default'));
      if (settingsSnap.exists()) settings = settingsSnap.data();
    } catch (e) {
      console.warn('Could not load settings:', e.message);
    }

    const taskList = tasksToNotify.map(t => `• [${t.priority}] ${t.title}`).join('\n');
    const message = `⚠️ <b>URGENT: ${tasksToNotify.length} task${tasksToNotify.length > 1 ? 's' : ''} due soon!</b>\n\n${taskList}`;

    await notify({ settings, message });

    // Mark tasks so they don't trigger again
    const updatedIds = [];
    for (const task of tasksToNotify) {
      await updateDoc(doc(db, 'tasks', task.id), {
        webhookFired: true,
        'remindersSent.whatsappSent': true,
        'remindersSent.telegramSent': true,
      });
      updatedIds.push(task.id);
    }

    return res.status(200).json({
      success: true,
      message: `Notified for ${updatedIds.length} task(s).`,
      updatedTaskIds: updatedIds,
    });
  } catch (error) {
    console.error('check-deadlines error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
