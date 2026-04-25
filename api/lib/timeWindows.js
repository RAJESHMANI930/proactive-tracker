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
