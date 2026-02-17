import { useReactFlow, useViewport } from '@xyflow/react';
import { useGraphStore } from '../store/graph-store';
import { ShortcutHint } from './Kbd';

// Alignment icon components
const AlignLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="1" y="1" width="1.5" height="12" rx="0.5" />
    <rect x="3.5" y="2.5" width="7" height="3" rx="0.5" />
    <rect x="3.5" y="8.5" width="5" height="3" rx="0.5" />
  </svg>
);

const AlignRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="11.5" y="1" width="1.5" height="12" rx="0.5" />
    <rect x="3.5" y="2.5" width="7" height="3" rx="0.5" />
    <rect x="5.5" y="8.5" width="5" height="3" rx="0.5" />
  </svg>
);

const AlignTopIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="1" y="1" width="12" height="1.5" rx="0.5" />
    <rect x="2.5" y="3.5" width="3" height="7" rx="0.5" />
    <rect x="8.5" y="3.5" width="3" height="5" rx="0.5" />
  </svg>
);

const AlignBottomIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="1" y="11.5" width="12" height="1.5" rx="0.5" />
    <rect x="2.5" y="3.5" width="3" height="7" rx="0.5" />
    <rect x="8.5" y="5.5" width="3" height="5" rx="0.5" />
  </svg>
);

const AlignCenterHIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="6.25" y="1" width="1.5" height="12" rx="0.5" />
    <rect x="2" y="2.5" width="10" height="3" rx="0.5" />
    <rect x="3.5" y="8.5" width="7" height="3" rx="0.5" />
  </svg>
);

const AlignCenterVIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="1" y="6.25" width="12" height="1.5" rx="0.5" />
    <rect x="2.5" y="2" width="3" height="10" rx="0.5" />
    <rect x="8.5" y="3.5" width="3" height="7" rx="0.5" />
  </svg>
);

const DistributeHIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="1" y="1" width="1.5" height="12" rx="0.5" />
    <rect x="11.5" y="1" width="1.5" height="12" rx="0.5" />
    <rect x="5.5" y="3" width="3" height="8" rx="0.5" />
  </svg>
);

const DistributeVIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
    <rect x="1" y="1" width="12" height="1.5" rx="0.5" />
    <rect x="1" y="11.5" width="12" height="1.5" rx="0.5" />
    <rect x="3" y="5.5" width="8" height="3" rx="0.5" />
  </svg>
);

function Divider() {
  return <div className="w-px h-5 bg-gray-600 mx-0.5" />;
}

function AlignButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="p-1 rounded text-gray-300 hover:text-white hover:bg-gray-700"
    >
      {children}
    </button>
  );
}

export function MultiSelectActions() {
  const selectedNodeIds = useGraphStore((s) => s.selectedNodeIds);
  const nodes = useGraphStore((s) => s.nodes);
  const { toggleNodesComplete, removeNode, selectNodes, moveNodes } = useGraphStore.getState();
  const { getNodes } = useReactFlow();
  const { x: vpX, y: vpY, zoom } = useViewport();

  if (selectedNodeIds.length <= 1) return null;

  const rfNodes = getNodes().filter((n) => selectedNodeIds.includes(n.id));
  if (rfNodes.length === 0) return null;

  // Compute bounding box in flow coordinates
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const node of rfNodes) {
    const w = node.width ?? 180;
    const h = node.height ?? 60;
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + w);
    maxY = Math.max(maxY, node.position.y + h);
  }

  // Convert bounding box top-center to screen coordinates
  const screenX = ((minX + maxX) / 2) * zoom + vpX;
  const screenY = minY * zoom + vpY;

  const selectedNodes = nodes.filter((n) => selectedNodeIds.includes(n.id));
  const allComplete = selectedNodes.every((n) => n.complete);

  // Alignment helpers — each reads fresh RF node positions at call time
  const align = (
    fn: (node: {
      id: string;
      position: { x: number; y: number };
      width: number;
      height: number;
    }) => { x: number; y: number },
  ) => {
    const current = getNodes().filter((n) => selectedNodeIds.includes(n.id));
    moveNodes(
      current.map((node) => ({
        id: node.id,
        position: fn({
          id: node.id,
          position: node.position,
          width: node.width ?? 180,
          height: node.height ?? 60,
        }),
      })),
    );
  };

  const alignLeft = () => {
    const ref = Math.min(...rfNodes.map((n) => n.position.x));
    align((n) => ({ x: ref, y: n.position.y }));
  };

  const alignRight = () => {
    const ref = Math.max(...rfNodes.map((n) => n.position.x + (n.width ?? 180)));
    align((n) => ({ x: ref - n.width, y: n.position.y }));
  };

  const alignTop = () => {
    const ref = Math.min(...rfNodes.map((n) => n.position.y));
    align((n) => ({ x: n.position.x, y: ref }));
  };

  const alignBottom = () => {
    const ref = Math.max(...rfNodes.map((n) => n.position.y + (n.height ?? 60)));
    align((n) => ({ x: n.position.x, y: ref - n.height }));
  };

  const alignCenterH = () => {
    const centerX = (minX + maxX) / 2;
    align((n) => ({ x: centerX - n.width / 2, y: n.position.y }));
  };

  const alignCenterV = () => {
    const centerY = (minY + maxY) / 2;
    align((n) => ({ x: n.position.x, y: centerY - n.height / 2 }));
  };

  const distributeH = () => {
    if (rfNodes.length < 3) return;
    const sorted = [...rfNodes].sort((a, b) => a.position.x - b.position.x);
    const first = sorted[0]!;
    const last = sorted[sorted.length - 1]!;
    const totalSpan = last.position.x + (last.width ?? 180) - first.position.x;
    const totalNodeWidth = sorted.reduce((sum, n) => sum + (n.width ?? 180), 0);
    const gap = (totalSpan - totalNodeWidth) / (sorted.length - 1);
    let cursor = first.position.x;
    moveNodes(
      sorted.map((node) => {
        const w = node.width ?? 180;
        const pos = { id: node.id, position: { x: cursor, y: node.position.y } };
        cursor += w + gap;
        return pos;
      }),
    );
  };

  const distributeV = () => {
    if (rfNodes.length < 3) return;
    const sorted = [...rfNodes].sort((a, b) => a.position.y - b.position.y);
    const first = sorted[0]!;
    const last = sorted[sorted.length - 1]!;
    const totalSpan = last.position.y + (last.height ?? 60) - first.position.y;
    const totalNodeHeight = sorted.reduce((sum, n) => sum + (n.height ?? 60), 0);
    const gap = (totalSpan - totalNodeHeight) / (sorted.length - 1);
    let cursor = first.position.y;
    moveNodes(
      sorted.map((node) => {
        const h = node.height ?? 60;
        const pos = { id: node.id, position: { x: node.position.x, y: cursor } };
        cursor += h + gap;
        return pos;
      }),
    );
  };

  return (
    <div
      className="fixed z-40 flex items-center gap-1 bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 shadow-xl pointer-events-auto"
      style={{
        left: screenX,
        top: screenY,
        transform: 'translate(-50%, calc(-100% - 10px))',
      }}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
    >
      <span className="text-xs text-gray-400 pr-1.5 border-r border-gray-600 shrink-0">
        {selectedNodeIds.length} selected
      </span>

      <button
        onClick={() => toggleNodesComplete(selectedNodeIds)}
        className={`text-xs py-1 px-2 rounded font-medium flex items-center gap-1.5 shrink-0 ${
          allComplete
            ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            : 'bg-green-600 text-white hover:bg-green-500'
        }`}
      >
        <span>{allComplete ? 'Mark Incomplete' : 'Mark Complete'}</span>
        <ShortcutHint id="toggleComplete" />
      </button>

      <Divider />

      {/* Align */}
      <AlignButton title="Align left edges" onClick={alignLeft}>
        <AlignLeftIcon />
      </AlignButton>
      <AlignButton title="Align right edges" onClick={alignRight}>
        <AlignRightIcon />
      </AlignButton>
      <AlignButton title="Align top edges" onClick={alignTop}>
        <AlignTopIcon />
      </AlignButton>
      <AlignButton title="Align bottom edges" onClick={alignBottom}>
        <AlignBottomIcon />
      </AlignButton>
      <AlignButton title="Center on vertical axis" onClick={alignCenterH}>
        <AlignCenterHIcon />
      </AlignButton>
      <AlignButton title="Center on horizontal axis" onClick={alignCenterV}>
        <AlignCenterVIcon />
      </AlignButton>

      <Divider />

      {/* Distribute — only useful with 3+ nodes */}
      <AlignButton
        title={
          rfNodes.length >= 3
            ? 'Distribute horizontally'
            : 'Distribute horizontally (need 3+ nodes)'
        }
        onClick={distributeH}
      >
        <span className={rfNodes.length < 3 ? 'opacity-30' : ''}>
          <DistributeHIcon />
        </span>
      </AlignButton>
      <AlignButton
        title={
          rfNodes.length >= 3 ? 'Distribute vertically' : 'Distribute vertically (need 3+ nodes)'
        }
        onClick={distributeV}
      >
        <span className={rfNodes.length < 3 ? 'opacity-30' : ''}>
          <DistributeVIcon />
        </span>
      </AlignButton>

      <Divider />

      <button
        onClick={() => {
          if (window.confirm(`Delete ${selectedNodeIds.length} selected nodes?`)) {
            selectedNodeIds.forEach((id) => removeNode(id));
            selectNodes([]);
          }
        }}
        className="text-xs py-1 px-2 rounded bg-red-600/40 text-red-300 hover:bg-red-600/60 border border-red-500/40 flex items-center gap-1.5 shrink-0"
      >
        <span>Delete All</span>
        <ShortcutHint id="delete" />
      </button>
    </div>
  );
}
