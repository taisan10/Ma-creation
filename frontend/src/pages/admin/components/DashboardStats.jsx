export default function DashboardStats({ stats = {}, labels = {} }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
      {Object.entries(labels).map(([key, label]) => (
        <div className="card" key={key}>
          <div className="text-xs uppercase font-mono text-ink/50">{label}</div>
          <div className="font-display text-3xl mt-2">{stats[key] ?? '—'}</div>
        </div>
      ))}
    </div>
  )
}
