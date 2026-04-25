const DONE = new Set(['Completed', 'Done']);
const SKIPPED = new Set(['Skipped', 'Incomplete']);

export function calcStats(tasks) {
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  // Last 30 days window
  const since30 = new Date(now - 30 * dayMs);
  const since7 = new Date(now - 7 * dayMs);

  const finished30 = tasks.filter(t => DONE.has(t.status) && t.completedAt && new Date(t.completedAt.seconds * 1000) >= since30);
  const skipped30 = tasks.filter(t => SKIPPED.has(t.status) && t.skippedAt && new Date(t.skippedAt.seconds * 1000) >= since30);
  const total30 = finished30.length + skipped30.length;
  const rate30 = total30 > 0 ? Math.round((finished30.length / total30) * 100) : 0;

  const finished7 = finished30.filter(t => new Date(t.completedAt.seconds * 1000) >= since7);
  const skipped7 = skipped30.filter(t => new Date(t.skippedAt.seconds * 1000) >= since7);
  const total7 = finished7.length + skipped7.length;
  const rate7 = total7 > 0 ? Math.round((finished7.length / total7) * 100) : 0;

  const pending = tasks.filter(t => t.status === 'Pending').length;
  const overdueCount = tasks.filter(t =>
    t.status === 'Pending' && t.deadline && new Date(t.deadline.seconds * 1000) < now
  ).length;

  // Current streak: consecutive days with ≥1 completion, going back from yesterday
  const streak = calcStreak(tasks, now);

  // 7-day bar chart data
  const bars = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now - (6 - i) * dayMs);
    const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const dayEnd = new Date(dayStart.getTime() + dayMs);
    const label = dayStart.toLocaleDateString([], { weekday: 'short' });
    const done = tasks.filter(t =>
      DONE.has(t.status) && t.completedAt &&
      new Date(t.completedAt.seconds * 1000) >= dayStart &&
      new Date(t.completedAt.seconds * 1000) < dayEnd
    ).length;
    const skipped = tasks.filter(t =>
      SKIPPED.has(t.status) && t.skippedAt &&
      new Date(t.skippedAt.seconds * 1000) >= dayStart &&
      new Date(t.skippedAt.seconds * 1000) < dayEnd
    ).length;
    return { label, done, skipped, total: done + skipped };
  });

  return { rate7, rate30, pending, overdueCount, streak, bars, finished30: finished30.length, skipped30: skipped30.length };
}

function calcStreak(tasks, now) {
  const dayMs = 24 * 60 * 60 * 1000;
  let streak = 0;
  let day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1); // start from yesterday
  while (true) {
    const dayEnd = new Date(day.getTime() + dayMs);
    const hasCompletion = tasks.some(t =>
      DONE.has(t.status) && t.completedAt &&
      new Date(t.completedAt.seconds * 1000) >= day &&
      new Date(t.completedAt.seconds * 1000) < dayEnd
    );
    if (!hasCompletion) break;
    streak++;
    day = new Date(day.getTime() - dayMs);
    if (streak > 365) break;
  }
  return streak;
}
