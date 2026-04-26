import { db } from './lib/firebase-admin.js';
import { doc, getDoc } from 'firebase/firestore';
import { sendTelegram } from './lib/notifications.js';

function validateSecret(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers['x-cron-secret'] === secret;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  if (!validateSecret(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { message, chatId: chatIdOverride } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  let chatId = chatIdOverride;
  if (!chatId) {
    const settingsSnap = await getDoc(doc(db, 'settings', 'default'));
    if (settingsSnap.exists()) chatId = settingsSnap.data().telegramChatId;
  }

  try {
    const result = await sendTelegram({
      chatId,
      botToken: process.env.TELEGRAM_BOT_TOKEN,
      message,
    });
    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error('send-telegram error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
