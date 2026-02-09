import { useState } from 'react';
import { layoutStateMachine, type LayoutNode, type LayoutEdge } from '../../utils/stateMachineLayout';
import { TransitionDetailPanel } from './TransitionDetailPanel';
import type { StateMachine } from '../../types';

interface StateMachineDiagramProps {
  stateMachine: StateMachine;
}

export function StateMachineDiagram({ stateMachine }: StateMachineDiagramProps) {
  const layout = layoutStateMachine(stateMachine);
  const [selectedTransition, setSelectedTransition] = useState<number | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  const transition = selectedTransition !== null ? stateMachine.transitions[selectedTransition] : null;

  return (
    <div className="flex gap-6">
      <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 overflow-auto">
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="mx-auto"
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
            </marker>
          </defs>

          {/* Edges */}
          {layout.edges.map((edge, i) => (
            <EdgePath
              key={i}
              edge={edge}
              isHighlighted={hoveredState !== null && (edge.from === hoveredState || edge.to === hoveredState)}
              onClick={() => setSelectedTransition(edge.transitionIndex)}
            />
          ))}

          {/* Nodes */}
          {layout.nodes.map((node) => (
            <StateNode
              key={node.id}
              node={node}
              isHighlighted={hoveredState === node.id}
              onMouseEnter={() => setHoveredState(node.id)}
              onMouseLeave={() => setHoveredState(null)}
            />
          ))}
        </svg>
      </div>

      {transition && (
        <div className="w-80 shrink-0">
          <TransitionDetailPanel
            transition={transition}
            onClose={() => setSelectedTransition(null)}
          />
        </div>
      )}
    </div>
  );
}

function StateNode({
  node,
  isHighlighted,
  onMouseEnter,
  onMouseLeave,
}: {
  node: LayoutNode;
  isHighlighted: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const x = node.x - node.width / 2;
  const y = node.y - node.height / 2;

  return (
    <g onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} className="cursor-pointer">
      {/* Initial state marker */}
      {node.isInitial && (
        <circle cx={x - 12} cy={node.y} r={5} fill="#4c6ef5" />
      )}
      <rect
        x={x}
        y={y}
        width={node.width}
        height={node.height}
        rx={8}
        fill={isHighlighted ? '#eef2ff' : 'white'}
        stroke={node.isInitial ? '#4c6ef5' : isHighlighted ? '#818cf8' : '#d1d5db'}
        strokeWidth={node.isInitial ? 2 : 1.5}
      />
      <text
        x={node.x}
        y={node.y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-medium"
        fill="#374151"
      >
        {node.id}
      </text>
    </g>
  );
}

function EdgePath({
  edge,
  isHighlighted,
  onClick,
}: {
  edge: LayoutEdge;
  isHighlighted: boolean;
  onClick: () => void;
}) {
  if (edge.points.length < 2) return null;

  const pathData = edge.points.length === 2
    ? `M ${edge.points[0].x} ${edge.points[0].y} L ${edge.points[1].x} ${edge.points[1].y}`
    : `M ${edge.points[0].x} ${edge.points[0].y} ` +
      edge.points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ');

  // Label position: midpoint of the path
  const mid = edge.points[Math.floor(edge.points.length / 2)];

  return (
    <g onClick={onClick} className="cursor-pointer">
      <path
        d={pathData}
        fill="none"
        stroke={isHighlighted ? '#818cf8' : '#9ca3af'}
        strokeWidth={isHighlighted ? 2 : 1.5}
        markerEnd="url(#arrowhead)"
      />
      {edge.label && (
        <text
          x={mid.x}
          y={mid.y - 6}
          textAnchor="middle"
          className="text-[10px]"
          fill={isHighlighted ? '#4f46e5' : '#6b7280'}
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}
