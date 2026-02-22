export function GraphLegend() {
  return (
    <div className="bg-surface-800/90 border border-surface-border rounded-lg p-3 text-xs backdrop-blur-sm">
      <div className="space-y-1 mb-3">
        <div className="text-stone-500 font-medium uppercase tracking-wide text-[10px] mb-1.5">
          Node type
        </div>
        {[
          { color: 'bg-amber-500', label: 'Goal' },
          { color: 'bg-blue-500', label: 'Quest' },
          { color: 'bg-green-600', label: 'Skill' },
          { color: 'bg-purple-600', label: 'Task' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-sm shrink-0 ${color}`} />
            <span className="text-stone-300">{label}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <div className="text-stone-500 font-medium uppercase tracking-wide text-[10px] mb-1.5">
          Status
        </div>
        {[
          { border: 'border-green-500', label: 'Complete' },
          { border: 'border-blue-400', label: 'Available' },
          { border: 'border-surface-border', label: 'Blocked' },
        ].map(({ border, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-sm shrink-0 border-2 ${border}`} />
            <span className="text-stone-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
