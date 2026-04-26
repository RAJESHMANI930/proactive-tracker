import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

const SETTINGS_DOC_ID = 'default';

export const DEFAULT_SETTINGS = {
  userId: 'default',
  whatsappNumber: '',
  callMeBotApiKey: '',
  telegramChatId: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  reminderPreferences: {
    telegramBeforeMinutes: 60,
    whatsappBeforeMinutes: 30,
    enableMissedFollowup: true,
    quietHoursStart: 22,
    quietHoursEnd: 8,
  },
  dailyDigestEnabled: true,
};

export function useSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, 'settings', SETTINGS_DOC_ID);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const updateSettings = async (updates) => {
    const ref = doc(db, 'settings', SETTINGS_DOC_ID);
    await setDoc(ref, updates, { merge: true });
  };

  return { settings, loading, updateSettings };
}
