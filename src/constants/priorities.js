export const PRIORITIES = ['Top', 'High', 'Medium', 'Low'];

export const PRIORITY_LABEL_COLORS = {
  Top: 'text-red-400',
  High: 'text-orange-400',
  Medium: 'text-blue-400',
  Low: 'text-gray-400',
};

export function getPriorityColor(priority) {
  switch (priority?.toLowerCase()) {
    case 'top': return 'bg-red-500/20 text-red-100 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
    case 'high': return 'bg-orange-500/20 text-orange-100 border-orange-500/50 shadow-[0_0_10px_rgba(249,115,22,0.1)]';
    case 'medium': return 'bg-blue-500/20 text-blue-100 border-blue-500/50';
    case 'low': return 'bg-gray-500/20 text-gray-100 border-gray-500/50';
    default: return 'bg-gray-500/20 text-gray-100 border-gray-500/50';
  }
}
