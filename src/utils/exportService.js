function tsToISO(ts) {
  if (!ts) return '';
  if (ts.seconds) return new Date(ts.seconds * 1000).toISOString();
  return new Date(ts).toISOString();
}

export function exportJSON(tasks) {
  const data = JSON.stringify(tasks, null, 2);
  download(data, 'tasks.json', 'application/json');
}

export function exportCSV(tasks) {
  const headers = ['id', 'title', 'priority', 'status', 'category', 'tags', 'deadline', 'completedAt', 'skippedAt', 'pomodoroCount', 'subtasks'];
  const rows = tasks.map(t => [
    t.id,
    `"${(t.title || '').replace(/"/g, '""')}"`,
    t.priority || '',
    t.status || '',
    t.category || '',
    `"${(t.tags || []).join(', ')}"`,
    tsToISO(t.deadline),
    tsToISO(t.completedAt),
    tsToISO(t.skippedAt),
    t.pomodoroCount || 0,
    `"${(t.subtasks || []).map(s => s.title).join('; ')}"`,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  download(csv, 'tasks.csv', 'text/csv');
}

function download(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
