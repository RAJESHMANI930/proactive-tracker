// Returns the next occurrence date for a recurring task template given a reference date.
export function getNextOccurrence(task, from = new Date()) {
  if (!task.isRecurring || !task.recurrencePattern) return null;

  const base = task.deadline ? new Date(task.deadline.seconds * 1000) : from;

  if (task.recurrencePattern === 'daily') {
    const next = new Date(base);
    next.setDate(base.getDate() + 1);
    // Advance until >= from
    while (next < from) next.setDate(next.getDate() + 1);
    return next;
  }

  if (task.recurrencePattern === 'weekly') {
    const days = task.recurrenceDays || [base.getDay()];
    const candidate = new Date(from);
    candidate.setHours(base.getHours(), base.getMinutes(), 0, 0);
    for (let i = 0; i < 14; i++) {
      const d = new Date(candidate);
      d.setDate(candidate.getDate() + i);
      if (days.includes(d.getDay()) && d > from) return d;
    }
  }

  return null;
}

// Build a fresh task instance from a recurring template.
export function buildRecurringInstance(template, nextDeadline) {
  const { id: parentTaskId, recurrencePattern, recurrenceDays, isRecurring, ...rest } = template;
  return {
    ...rest,
    parentTaskId,
    status: 'Pending',
    deadline: nextDeadline,
    completedAt: null,
    skippedAt: null,
    webhookFired: false,
    remindersSent: { whatsappSent: false, telegramSent: false, missedFollowup: false },
    pomodoroCount: 0,
    subtasks: (template.subtasks || []).map(s => ({ ...s, isCompleted: false })),
    isRecurring: false, // instances are not templates
    recurrencePattern: null,
    recurrenceDays: null,
  };
}
