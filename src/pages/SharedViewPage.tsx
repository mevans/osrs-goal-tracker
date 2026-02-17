import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ReactFlow,
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  type Node,
  type Edge,
} from '@xyflow/react';
import { parseShareParam } from '../engine/serialization';
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
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Invalid Share Link</h1>
          <p className="text-gray-400">This link is invalid or has expired.</p>
          <a href="/" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            Go to Editor
          </a>
        </div>
      </div>
    );
  }

  if (!graphData) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-gray-400">Loading...</div>
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
  const statuses = useMemo(
    () => computeAllStatuses(data.nodes, data.edges),
    [data.nodes, data.edges],
  );

  const rfNodes: Node<CustomNodeData>[] = useMemo(
    () => buildRfNodes(data.nodes, statuses, { draggable: false }),
    [data.nodes, statuses],
  );

  const rfEdges: Edge[] = useMemo(() => buildRfEdges(data.edges), [data.edges]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <div className="flex items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm font-semibold mr-3">OSRS Planner</span>
        <span className="text-xs text-gray-400 bg-gray-700 px-2 py-0.5 rounded">Read-only</span>
        <div className="flex-1" />
        <a href="/" className="text-sm text-blue-400 hover:text-blue-300">
          Open Editor
        </a>
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
          <Controls className="bg-gray-800! border-gray-700! shadow-lg! [&>button]:bg-gray-800! [&>button]:border-gray-700! [&>button]:text-gray-300! [&>button:hover]:bg-gray-700!" />
          <MiniMap
            className="bg-gray-800! border-gray-700!"
            nodeColor="#4b5563"
            maskColor="rgba(0,0,0,0.6)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
