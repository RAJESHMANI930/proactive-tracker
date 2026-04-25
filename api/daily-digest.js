import { db } from './lib/firebase-admin.js';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import { notify } from './lib/notifications.js';

function validateSecret(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers['x-cron-secret'] === secret;
}

function fmtDeadline(ts) {
  if (!ts) return '';
  return new Date(ts.seconds * 1000).toLocaleString();
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  if (!validateSecret(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let settings = {};
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'default'));
      if (settingsSnap.exists()) settings = settingsSnap.data();
    } catch (e) {
      console.warn('Could not load settings:', e.message);
    }

    if (settings.dailyDigestEnabled === false) {
      return res.status(200).json({ success: true, message: 'Daily digest disabled in settings.' });
    }

    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60000);

    // Yesterday's missed (Skipped or Incomplete in last 24h)
    const skippedSnap = await getDocs(
      query(
        collection(db, 'tasks'),
        where('status', 'in', ['Skipped', 'Incomplete']),
        where('skippedAt', '>=', Timestamp.fromDate(yesterday))
      )
    );
    const missed = [];
    skippedSnap.forEach(d => missed.push({ id: d.id, ...d.data() }));

    // Today's upcoming Top/High pending
    const pendingSnap = await getDocs(
      query(collection(db, 'tasks'), where('status', '==', 'Pending'))
    );
    const upcoming = [];
    pendingSnap.forEach(d => {
      const t = { id: d.id, ...d.data() };
      if (!t.deadline) return;
      if (t.priority !== 'Top' && t.priority !== 'High') return;
      const deadline = new Date(t.deadline.seconds * 1000);
      if (deadline >= now && deadline <= tomorrow) upcoming.push(t);
    });

    if (missed.length === 0 && upcoming.length === 0) {
      return res.status(200).json({ success: true, message: 'Nothing to digest.' });
    }

    const lines = ['☀️ <b>Daily Digest</b>'];
    if (missed.length) {
      lines.push('', `<b>Missed (${missed.length}):</b>`);
      missed.forEach(t => lines.push(`• [${t.status}] ${t.title}`));
    }
    if (upcoming.length) {
      lines.push('', `<b>Today's priorities (${upcoming.length}):</b>`);
      upcoming.forEach(t => lines.push(`• [${t.priority}] ${t.title} — ${fmtDeadline(t.deadline)}`));
    }

    const message = lines.join('\n');
    const results = await notify({ settings, message });

    // Mark missed tasks so we don't re-include them tomorrow
    const followupIds = [];
    for (const t of missed) {
      if (t.remindersSent?.missedFollowup) continue;
      await updateDoc(doc(db, 'tasks', t.id), {
        'remindersSent.missedFollowup': true,
      });
      followupIds.push(t.id);
    }

    return res.status(200).json({
      success: true,
      message: `Digest sent. Missed: ${missed.length}, Upcoming: ${upcoming.length}`,
      followupIds,
      notifyResults: results,
    });
  } catch (error) {
    console.error('daily-digest error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
