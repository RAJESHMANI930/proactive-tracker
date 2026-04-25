import { db } from './lib/firebase-admin.js';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getNextOccurrence, buildRecurringInstance } from '../src/utils/recurringTasks.js';

function validateSecret(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
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

    // Get all recurring templates
    const snapshot = await getDocs(
      query(collection(db, 'tasks'), where('isRecurring', '==', true))
    );

    const created = [];

    for (const document of snapshot.docs) {
      const template = { id: document.id, ...document.data() };

      const nextDeadline = getNextOccurrence(template, now);
      if (!nextDeadline) continue;

      // Check if an instance for this date already exists to avoid duplicates
      const dayStart = new Date(nextDeadline.getFullYear(), nextDeadline.getMonth(), nextDeadline.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);

      const existing = await getDocs(
        query(
          collection(db, 'tasks'),
          where('parentTaskId', '==', template.id),
          where('status', '==', 'Pending')
        )
      );

      const alreadyExists = existing.docs.some(d => {
        const dl = d.data().deadline;
        if (!dl) return false;
        const dlDate = new Date(dl.seconds * 1000);
        return dlDate >= dayStart && dlDate < dayEnd;
      });

      if (alreadyExists) continue;

      const instance = buildRecurringInstance(template, nextDeadline);
      const ref = await addDoc(collection(db, 'tasks'), {
        ...instance,
        createdAt: serverTimestamp(),
      });
      created.push({ id: ref.id, title: template.title, deadline: nextDeadline });
    }

    return res.status(200).json({
      success: true,
      message: `Created ${created.length} recurring task instance(s).`,
      created,
    });
  } catch (error) {
    console.error('reset-recurring error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
