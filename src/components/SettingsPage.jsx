import { useState, useEffect } from 'react';
import { useSettings } from '../hooks/useSettings';

const DEFAULT_FORM = {
  whatsappNumber: '',
  callMeBotApiKey: '',
  telegramChatId: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  telegramBeforeMinutes: 60,
  whatsappBeforeMinutes: 30,
  enableMissedFollowup: true,
  quietHoursStart: 22,
  quietHoursEnd: 8,
  dailyDigestEnabled: true,
};

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-white/50 uppercase tracking-widest mb-1 ml-1">{label}</label>
      {hint && <p className="text-[11px] text-white/30 ml-1 mb-2">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls = 'w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-medium';

export default function SettingsPage() {
  const { settings, loading, updateSettings } = useSettings();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loading) {
      setForm({
        whatsappNumber: settings.whatsappNumber || '',
        callMeBotApiKey: settings.callMeBotApiKey || '',
        telegramChatId: settings.telegramChatId || '',
        timezone: settings.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        telegramBeforeMinutes: settings.reminderPreferences?.telegramBeforeMinutes ?? 60,
        whatsappBeforeMinutes: settings.reminderPreferences?.whatsappBeforeMinutes ?? 30,
        enableMissedFollowup: settings.reminderPreferences?.enableMissedFollowup ?? true,
        quietHoursStart: settings.reminderPreferences?.quietHoursStart ?? 22,
        quietHoursEnd: settings.reminderPreferences?.quietHoursEnd ?? 8,
        dailyDigestEnabled: settings.dailyDigestEnabled ?? true,
      });
    }
  }, [loading, settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateSettings({
        whatsappNumber: form.whatsappNumber.trim(),
        callMeBotApiKey: form.callMeBotApiKey.trim(),
        telegramChatId: form.telegramChatId.trim(),
        timezone: form.timezone.trim(),
        dailyDigestEnabled: form.dailyDigestEnabled,
        reminderPreferences: {
          telegramBeforeMinutes: Number(form.telegramBeforeMinutes),
          whatsappBeforeMinutes: Number(form.whatsappBeforeMinutes),
          enableMissedFollowup: form.enableMissedFollowup,
          quietHoursStart: Number(form.quietHoursStart),
          quietHoursEnd: Number(form.quietHoursEnd),
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-8 pb-24">
      <h2 className="text-xl font-black text-white mb-1">Settings</h2>
      <p className="text-sm text-white/40 mb-8">Configure notifications and reminder preferences.</p>

      <form onSubmit={handleSave} className="flex flex-col gap-6">

        {/* WhatsApp */}
        <section className="bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col gap-5">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">💬</span>
            <div>
              <h3 className="font-bold text-white">WhatsApp Reminders</h3>
              <p className="text-xs text-white/40">Via CallMeBot — free for personal use</p>
            </div>
          </div>
          <Field label="WhatsApp Number" hint="International format, e.g. +919876543210">
            <input type="tel" value={form.whatsappNumber} onChange={e => setForm({ ...form, whatsappNumber: e.target.value })} placeholder="+919876543210" className={inputCls} />
          </Field>
          <Field label="CallMeBot API Key" hint="Get your free key at api.callmebot.com/whatsapp.php">
            <input type="text" value={form.callMeBotApiKey} onChange={e => setForm({ ...form, callMeBotApiKey: e.target.value })} placeholder="Your CallMeBot API key" className={inputCls} />
          </Field>
          <Field label="Send reminder (minutes before deadline)">
            <input type="number" min="5" max="1440" value={form.whatsappBeforeMinutes} onChange={e => setForm({ ...form, whatsappBeforeMinutes: e.target.value })} className={inputCls} />
          </Field>
        </section>

        {/* Telegram */}
        <section className="bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col gap-5">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">✈️</span>
            <div>
              <h3 className="font-bold text-white">Telegram Reminders</h3>
              <p className="text-xs text-white/40">100% free official API — no limits</p>
            </div>
          </div>
          <Field label="Telegram Chat ID" hint="Message @userinfobot on Telegram to get your Chat ID">
            <input type="text" value={form.telegramChatId} onChange={e => setForm({ ...form, telegramChatId: e.target.value })} placeholder="Your Telegram Chat ID" className={inputCls} />
          </Field>
          <Field label="Send reminder (minutes before deadline)">
            <input type="number" min="5" max="1440" value={form.telegramBeforeMinutes} onChange={e => setForm({ ...form, telegramBeforeMinutes: e.target.value })} className={inputCls} />
          </Field>
        </section>

        {/* General */}
        <section className="bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col gap-5">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-2xl">⚙️</span>
            <div>
              <h3 className="font-bold text-white">General</h3>
            </div>
          </div>
          <Field label="Timezone" hint="e.g. Asia/Kolkata, America/New_York, Europe/London">
            <input type="text" value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })} placeholder="Asia/Kolkata" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Quiet Hours Start (0–23)">
              <input type="number" min="0" max="23" value={form.quietHoursStart} onChange={e => setForm({ ...form, quietHoursStart: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Quiet Hours End (0–23)">
              <input type="number" min="0" max="23" value={form.quietHoursEnd} onChange={e => setForm({ ...form, quietHoursEnd: e.target.value })} className={inputCls} />
            </Field>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.enableMissedFollowup}
                onChange={e => setForm({ ...form, enableMissedFollowup: e.target.checked })}
                className="w-4 h-4 appearance-none rounded border border-white/30 checked:bg-indigo-500 checked:border-indigo-500 transition-colors"
              />
              {form.enableMissedFollowup && (
                <svg className="absolute w-3 h-3 top-[2px] left-[2px] text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm text-white/80">Send follow-up message for missed/skipped tasks</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={form.dailyDigestEnabled}
                onChange={e => setForm({ ...form, dailyDigestEnabled: e.target.checked })}
                className="w-4 h-4 appearance-none rounded border border-white/30 checked:bg-indigo-500 checked:border-indigo-500 transition-colors"
              />
              {form.dailyDigestEnabled && (
                <svg className="absolute w-3 h-3 top-[2px] left-[2px] text-white pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-sm text-white/80">Daily morning digest (skipped + upcoming tasks)</span>
          </label>
        </section>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isSaving
            ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            : saved
            ? '✓ Saved!'
            : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
