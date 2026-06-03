export default function StatCard({ label, value, trend, badge, icon, accent }) {
  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900/95 p-6 shadow-lg shadow-slate-950/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
        </div>
        <div className={`rounded-3xl p-3 ${accent || 'bg-slate-800 text-slate-200'}`}>
          {icon}
        </div>
      </div>
      {trend ? <p className="mt-4 text-sm text-slate-400">{trend}</p> : null}
      {badge ? <span className="mt-4 inline-block rounded-full bg-slate-800 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">{badge}</span> : null}
    </div>
  )
}
