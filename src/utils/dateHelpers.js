export function timestampToDatetimeLocal(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp.seconds * 1000);
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

export function timestampToDisplay(timestamp) {
  if (!timestamp) return null;
  return new Date(timestamp.seconds * 1000).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function isOverdue(timestamp) {
  if (!timestamp) return false;
  return new Date(timestamp.seconds * 1000) < new Date();
}
