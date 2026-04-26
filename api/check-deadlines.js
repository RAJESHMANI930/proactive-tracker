import { db } from './lib/firebase-admin.js';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { isWithinLeadTime, isQuietHour } from './lib/timeWindows.js';
import { sendTelegram, sendWhatsApp } from './lib/notifications.js';

function validateSecret(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers['x-cron-secret'] === secret;
}

const URGENT_PRIORITIES = new Set(['Top', 'High']);

function formatTaskLine(task) {
  const deadline = task.deadline ? new Date(task.deadline.seconds * 1000) : null;
  const when = deadline ? deadline.toLocaleString() : '';
  return `• [${task.priority}] ${task.title}${when ? ` — due ${when}` : ''}`;
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

    let settings = {};
    try {
      const settingsSnap = await getDoc(doc(db, 'settings', 'default'));
      if (settingsSnap.exists()) settings = settingsSnap.data();
    } catch (e) {
      console.warn('Could not load settings:', e.message);
    }

    const prefs = settings.reminderPreferences || {};
    const telegramLead = prefs.telegramBeforeMinutes ?? 60;
    const whatsappLead = prefs.whatsappBeforeMinutes ?? 30;
    const quiet = isQuietHour(now, settings);

    const snapshot = await getDocs(
      query(collection(db, 'tasks'), where('status', '==', 'Pending'))
    );

    const telegramQueue = [];
    const whatsappQueue = [];

    snapshot.forEach(document => {
      const task = { id: document.id, ...document.data() };
      if (!URGENT_PRIORITIES.has(task.priority)) return;
      if (!task.deadline) return;

      const sent = task.remindersSent || {};
      const deadlineSec = task.deadline.seconds;

      if (!sent.telegramSent && isWithinLeadTime(deadlineSec, telegramLead, now)) {
        telegramQueue.push(task);
      }
      if (!sent.whatsappSent && isWithinLeadTime(deadlineSec, whatsappLead, now)) {
        whatsappQueue.push(task);
      }
    });

    const results = { telegram: [], whatsapp: [], skippedQuiet: false };

    if (quiet) {
      results.skippedQuiet = true;
      return res.status(200).json({
        success: true,
        message: 'In quiet hours — reminders suppressed.',
        pendingTelegram: telegramQueue.length,
        pendingWhatsapp: whatsappQueue.length,
      });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    for (const task of telegramQueue) {
      const message = `⏰ <b>Reminder (T-${telegramLead}m)</b>\n${formatTaskLine(task)}`;
      try {
        await sendTelegram({ chatId: settings.telegramChatId, botToken, message });
        await updateDoc(doc(db, 'tasks', task.id), {
          'remindersSent.telegramSent': true,
        });
        results.telegram.push(task.id);
      } catch (err) {
        console.error(`Telegram failed for task ${task.id}:`, err.message);
      }
    }

    for (const task of whatsappQueue) {
      const message = `⚠️ URGENT (T-${whatsappLead}m): ${task.title} [${task.priority}]`;
      try {
        await sendWhatsApp({
          phone: settings.whatsappNumber,
          apiKey: settings.callMeBotApiKey,
          message,
        });
        await updateDoc(doc(db, 'tasks', task.id), {
          'remindersSent.whatsappSent': true,
          webhookFired: true,
        });
        results.whatsapp.push(task.id);
      } catch (err) {
        console.error(`WhatsApp failed for task ${task.id}:`, err.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: `Telegram: ${results.telegram.length}, WhatsApp: ${results.whatsapp.length}`,
      ...results,
    });
  } catch (error) {
    console.error('check-deadlines error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
}
