export function getDeadlineWindows() {
  const now = new Date();
  return {
    now,
    triggerWindowEnd: new Date(now.getTime() + 30 * 60000),
    safetyWindowStart: new Date(now.getTime() - 2 * 60 * 60000),
  };
}

export function isInDeadlineWindow(deadlineSeconds, { triggerWindowEnd, safetyWindowStart }) {
  const deadlineDate = new Date(deadlineSeconds * 1000);
  return deadlineDate <= triggerWindowEnd && deadlineDate >= safetyWindowStart;
}

export function isWithinLeadTime(deadlineSeconds, leadMinutes, now = new Date()) {
  if (!leadMinutes || leadMinutes <= 0) return false;
  const deadlineMs = deadlineSeconds * 1000;
  const leadStartMs = deadlineMs - leadMinutes * 60000;
  const safetyStartMs = now.getTime() - 2 * 60 * 60000;
  return now.getTime() >= leadStartMs && deadlineMs >= safetyStartMs;
}

export function isQuietHour(date, settings) {
  const prefs = settings?.reminderPreferences;
  if (!prefs) return false;
  const { quietHoursStart, quietHoursEnd } = prefs;
  if (quietHoursStart == null || quietHoursEnd == null) return false;
  if (quietHoursStart === quietHoursEnd) return false;

  const tz = settings?.timezone;
  let hour;
  try {
    hour = tz
      ? Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz }).format(date))
      : date.getHours();
  } catch {
    hour = date.getHours();
  }

  if (quietHoursStart < quietHoursEnd) {
    return hour >= quietHoursStart && hour < quietHoursEnd;
  }
  return hour >= quietHoursStart || hour < quietHoursEnd;
}
