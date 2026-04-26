import { db } from './lib/firebase-admin.js';
import { doc, getDoc } from 'firebase/firestore';
import { sendWhatsApp } from './lib/notifications.js';

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

  const { message, phone: phoneOverride, apiKey: apiKeyOverride } = req.body || {};
  if (!message) {
    return res.status(400).json({ error: 'message is required' });
  }

  let phone = phoneOverride;
  let apiKey = apiKeyOverride;

  if (!phone || !apiKey) {
    const settingsSnap = await getDoc(doc(db, 'settings', 'default'));
    if (settingsSnap.exists()) {
      const s = settingsSnap.data();
      phone = phone || s.whatsappNumber;
      apiKey = apiKey || s.callMeBotApiKey;
    }
  }

  try {
    const result = await sendWhatsApp({ phone, apiKey, message });
    return res.status(200).json({ success: true, result });
  } catch (err) {
    console.error('send-whatsapp error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
