const PRIORITIES = ['Top', 'High', 'Medium', 'Low'];
const STATUSES = ['Pending', 'Completed', 'Skipped', 'Incomplete'];

export default function FilterBar({ filters, onChange, allTags }) {
  const { search = '', tags = [], priorities = [], statuses = [] } = filters;

  const toggle = (key, value) => {
    const current = filters[key] || [];
    onChange({
      ...filters,
      [key]: current.includes(value) ? current.filter(v => v !== value) : [...current, value],
    });
  };

  const hasActive = search || tags.length || priorities.length || statuses.length;

  return (
    <div className="px-6 py-3 flex flex-col gap-2 border-b border-white/5">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={e => onChange({ ...filters, search: e.target.value })}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
        />
        {search && (
          <button onClick={() => onChange({ ...filters, search: '' })} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">✕</button>
        )}
      </div>

      {/* Priority pills */}
      <div className="flex flex-wrap gap-1.5">
        {PRIORITIES.map(p => (
          <button
            key={p}
            onClick={() => toggle('priorities', p)}
            className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold transition-all
              ${priorities.includes(p) ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}
          >
            {p}
          </button>
        ))}
        {STATUSES.map(s => (
          <button
            key={s}
            onClick={() => toggle('statuses', s)}
            className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold transition-all
              ${statuses.includes(s) ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}
          >
            {s}
          </button>
        ))}
        {allTags.map(tag => (
          <button
            key={tag}
            onClick={() => toggle('tags', tag)}
            className={`text-[11px] px-2.5 py-1 rounded-full border font-semibold transition-all
              ${tags.includes(tag) ? 'bg-violet-600 border-violet-500 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:border-white/30'}`}
          >
            #{tag}
          </button>
        ))}
        {hasActive && (
          <button
            onClick={() => onChange({ search: '', tags: [], priorities: [], statuses: [] })}
            className="text-[11px] px-2.5 py-1 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
