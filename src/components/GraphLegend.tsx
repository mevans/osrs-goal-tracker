import { legendNodeTypes } from '../engine/node-registry';
import type { DerivedStatus } from '../engine/types';
import { nodeAppearance, statusAppearance } from './node-appearance';

const STATUS_LABELS: { status: DerivedStatus; label: string }[] = [
  { status: 'complete', label: 'Complete' },
  { status: 'available', label: 'Available' },
  { status: 'blocked', label: 'Blocked' },
];

export function GraphLegend() {
  return (
    <div className="bg-surface-800/90 border border-surface-border rounded-lg p-3 text-xs backdrop-blur-sm">
      <div className="space-y-1 mb-3">
        <div className="text-stone-500 font-medium uppercase tracking-wide text-[10px] mb-1.5">
          Node type
        </div>
        {legendNodeTypes().map((info) => (
          <div key={info.type} className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-sm shrink-0 ${nodeAppearance(info.type).swatch}`}
            />
            <span className="text-stone-300">{info.shortLabel}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <div className="text-stone-500 font-medium uppercase tracking-wide text-[10px] mb-1.5">
          Status
        </div>
        {STATUS_LABELS.map(({ status, label }) => (
          <div key={status} className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-sm shrink-0 border-2 ${statusAppearance(status).swatch}`}
            />
            <span className="text-stone-300">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
