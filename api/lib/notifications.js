export async function sendWhatsApp({ phone, apiKey, message }) {
  if (!phone || !apiKey) return { skipped: true, reason: 'WhatsApp not configured' };
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CallMeBot failed: ${res.statusText}`);
  return { sent: true, channel: 'whatsapp' };
}

export async function sendTelegram({ chatId, botToken, message }) {
  if (!chatId || !botToken) return { skipped: true, reason: 'Telegram not configured' };
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML' }),
  });
  if (!res.ok) throw new Error(`Telegram failed: ${res.statusText}`);
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
      results.push({ skipped: true, reason: err.message, channel: 'telegram' });
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
      results.push({ skipped: true, reason: err.message, channel: 'whatsapp' });
    }
  }

  return results;
}
