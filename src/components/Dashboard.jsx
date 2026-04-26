import { useMemo } from 'react';
import { calcStats } from '../utils/statsCalculator';

function StatCard({ label, value, sub, accent = 'indigo' }) {
  const colors = {
    indigo: 'from-indigo-500/20 to-indigo-600/10 border-indigo-500/20 text-indigo-300',
    green: 'from-green-500/20 to-green-600/10 border-green-500/20 text-green-300',
    orange: 'from-orange-500/20 to-orange-600/10 border-orange-500/20 text-orange-300',
    red: 'from-red-500/20 to-red-600/10 border-red-500/20 text-red-300',
  };
  return (
    <div className={`bg-gradient-to-br ${colors[accent]} border rounded-2xl p-5 flex flex-col gap-1`}>
      <p className="text-xs uppercase tracking-widest text-white/40">{label}</p>
      <p className="text-3xl font-black text-white">{value}</p>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  );
}

function BarChart({ bars }) {
  const maxTotal = Math.max(...bars.map(b => b.total), 1);
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
      <p className="text-xs uppercase tracking-widest text-white/40 mb-4">Last 7 days</p>
      <div className="flex items-end gap-2 h-28">
        {bars.map((b, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: '96px' }}>
              {b.skipped > 0 && (
                <div
                  className="w-full rounded-t bg-orange-500/50"
                  style={{ height: `${(b.skipped / maxTotal) * 96}px` }}
                />
              )}
              {b.done > 0 && (
                <div
                  className="w-full rounded-t bg-indigo-500"
                  style={{ height: `${(b.done / maxTotal) * 96}px` }}
                />
              )}
              {b.total === 0 && <div className="w-full h-1 rounded bg-white/10" />}
            </div>
            <span className="text-[10px] text-white/30">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3">
        <span className="flex items-center gap-1.5 text-[11px] text-white/40">
          <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> Completed
        </span>
        <span className="flex items-center gap-1.5 text-[11px] text-white/40">
          <span className="w-2.5 h-2.5 rounded-sm bg-orange-500/50 inline-block" /> Skipped
        </span>
      </div>
    </div>
  );
}

export default function Dashboard({ tasks }) {
  const stats = useMemo(() => calcStats(tasks), [tasks]);

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto flex flex-col gap-5">
      <h2 className="text-xl font-black text-white">Your Stats</h2>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="7-day rate" value={`${stats.rate7}%`} sub={`${stats.finished30} done / ${stats.skipped30} skipped (30d)`} accent="indigo" />
        <StatCard label="30-day rate" value={`${stats.rate30}%`} sub="completion" accent="green" />
        <StatCard label="Pending" value={stats.pending} accent="orange" />
        <StatCard label="Overdue" value={stats.overdueCount} accent={stats.overdueCount > 0 ? 'red' : 'orange'} />
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-5">
        <div className="text-5xl">🔥</div>
        <div>
          <p className="text-3xl font-black text-white">{stats.streak}</p>
          <p className="text-xs text-white/40">day streak</p>
          <p className="text-[11px] text-white/30 mt-0.5">
            {stats.streak === 0 ? 'Complete a task today to start your streak!' : 'Keep it up!'}
          </p>
        </div>
      </div>

      <BarChart bars={stats.bars} />
    </div>
  );
}
