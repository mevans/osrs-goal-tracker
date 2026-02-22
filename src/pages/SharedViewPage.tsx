import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  type Node,
  type Edge,
} from '@xyflow/react';
import { parseShareParam } from '../engine/serialization';
import { analytics } from '../analytics';
import { useGraphStore } from '../store/graph-store';
import { computeAllStatuses } from '../engine/graph-engine';
import type { GraphData } from '../engine/types';
import { CustomNode, type CustomNodeData } from '../components/nodes/CustomNode';
import { RequiresEdge, RequiresArrowDef } from '../components/edges/RequiresEdge';
import { ImprovesEdge, ImprovesArrowDef } from '../components/edges/ImprovesEdge';
import { buildRfNodes, buildRfEdges } from '../components/rfHelpers';

const nodeTypes = { custom: CustomNode };
const edgeTypes = { requires: RequiresEdge, improves: ImprovesEdge };

export function SharedViewPage() {
  const [searchParams] = useSearchParams();
  const param = searchParams.get('g');
  const [graphData, setGraphData] = useState<GraphData | undefined>(undefined);
  const [parseError, setParseError] = useState(false);

  useEffect(() => {
    if (!param) return;
    parseShareParam(param).then((data) => {
      if (data) {
        setGraphData(data);
      } else {
        setParseError(true);
      }
    });
  }, [param]);

  if (!param || parseError) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Share Link</h1>
          <p className="text-stone-400">This link is invalid or has expired.</p>
          <a href="/" className="text-brand-bright hover:text-brand mt-4 inline-block">
            Go to Editor
          </a>
        </div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-900 text-white">
        <div className="text-stone-400">Loading...</div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <SharedView data={graphData} />
    </ReactFlowProvider>
  );
}

function SharedView({ data }: { data: GraphData }) {
  const navigate = useNavigate();

  const statuses = useMemo(
    () => computeAllStatuses(data.nodes, data.edges),
    [data.nodes, data.edges],
  );

  const rfNodes: Node<CustomNodeData>[] = useMemo(
    () => buildRfNodes(data.nodes, statuses, { draggable: false }),
    [data.nodes, statuses],
  );

  const rfEdges: Edge[] = useMemo(() => buildRfEdges(data.edges), [data.edges]);

  const handleOpenInEditor = () => {
    const { nodes: existingNodes } = useGraphStore.getState();
    if (existingNodes.length > 0) {
      const confirmed = window.confirm(
        'This will replace your current plan in the editor. Continue?\n\n(Export your current plan first if you want to save it)',
      );
      if (!confirmed) return;
    }
    useGraphStore.getState().loadGraph(data);
    useGraphStore.temporal.getState().clear();
    analytics.openInEditor();
    navigate('/');
  };

  return (
    <div className="h-screen flex flex-col bg-surface-900 text-white">
      <div className="flex items-center px-4 py-2 bg-surface-800 border-b border-surface-border gap-3">
        <span className="text-sm font-semibold text-brand-text">Planscape</span>
        <span className="text-xs text-stone-400 bg-surface-700 px-2 py-0.5 rounded">Read-only</span>
        <span className="text-xs text-stone-500">
          {data.nodes.length} nodes · {data.edges.length} edges
        </span>
        <div className="flex-1" />
        <button
          onClick={handleOpenInEditor}
          className="px-3 py-1.5 text-sm text-white bg-brand hover:bg-brand-bright rounded font-medium transition-colors"
        >
          Open in Editor
        </button>
      </div>
      <div className="flex-1">
        <RequiresArrowDef />
        <ImprovesArrowDef />
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          colorMode="dark"
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#374151" />
          <Controls className="bg-surface-800! border-surface-border! shadow-lg! [&>button]:bg-surface-800! [&>button]:border-surface-border! [&>button]:text-stone-300! [&>button:hover]:bg-surface-700!" />
          <MiniMap
            className="bg-surface-800! border-surface-border!"
            nodeColor="#4b5563"
            maskColor="rgba(0,0,0,0.6)"
          />
          <Panel position="top-right">
            <SharedLegend />
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
}

function SharedLegend() {
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
