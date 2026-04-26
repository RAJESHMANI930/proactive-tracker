const MAX_MESSAGE_LENGTH = 4000;
const PHONE_RE = /^\+[1-9]\d{6,14}$/;

function sanitizeForTelegram(text) {
  // Strip HTML tags so user-generated task titles can't inject markup
  return String(text).replace(/<[^>]*>/g, '').slice(0, MAX_MESSAGE_LENGTH);
}

function validatePhone(phone) {
  return typeof phone === 'string' && PHONE_RE.test(phone.replace(/\s/g, ''));
}

export async function sendWhatsApp({ phone, apiKey, message }) {
  if (!phone || !apiKey) return { skipped: true, reason: 'WhatsApp not configured' };
  if (!validatePhone(phone)) return { skipped: true, reason: 'Invalid phone number format' };

  const safeMessage = String(message).slice(0, MAX_MESSAGE_LENGTH);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(safeMessage)}&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CallMeBot request failed (${res.status})`);
  return { sent: true, channel: 'whatsapp' };
}

export async function sendTelegram({ chatId, botToken, message }) {
  if (!chatId || !botToken) return { skipped: true, reason: 'Telegram not configured' };

  const safeMessage = sanitizeForTelegram(message);
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: safeMessage }),
  });
  if (!res.ok) throw new Error(`Telegram request failed (${res.status})`);
  return { sent: true, channel: 'telegram' };
}

export async function notify({ settings = {}, message, channels = ['telegram', 'whatsapp'] }) {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const results = [];

  if (channels.includes('telegram')) {
    try {
      results.push(await sendTelegram({
        chatId: settings.telegramChatId,
        botToken: telegramToken,
        message,
      }));
    } catch (err) {
      console.error('Telegram notify error:', err.message);
      results.push({ skipped: true, reason: 'Telegram send failed', channel: 'telegram' });
    }
  }

  if (channels.includes('whatsapp')) {
    try {
      results.push(await sendWhatsApp({
        phone: settings.whatsappNumber,
        apiKey: settings.callMeBotApiKey,
        message,
      }));
    } catch (err) {
      console.error('WhatsApp notify error:', err.message);
      results.push({ skipped: true, reason: 'WhatsApp send failed', channel: 'whatsapp' });
    }
  }

  return results;
}
