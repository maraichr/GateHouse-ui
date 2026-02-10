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
      <div className="flex-1 surface-card p-4 overflow-auto">
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
              <polygon points="0 0, 10 3.5, 0 7" className="fill-surface-400 dark:fill-zinc-500" />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" className="fill-brand-500" />
            </marker>
            <filter id="node-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="2" floodOpacity="0.08" />
            </filter>
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
        <circle cx={x - 12} cy={node.y} r={5} className="fill-brand-500" />
      )}
      <rect
        x={x}
        y={y}
        width={node.width}
        height={node.height}
        rx={10}
        fill={isHighlighted ? 'var(--tw-brand-50, #eef2ff)' : 'var(--tw-surface, white)'}
        stroke={node.isInitial ? 'var(--tw-brand-500, #6366f1)' : isHighlighted ? 'var(--tw-brand-400, #818cf8)' : 'var(--tw-border, #e2e8f0)'}
        strokeWidth={node.isInitial ? 2 : 1.5}
        filter="url(#node-shadow)"
        className={isHighlighted ? 'fill-brand-50 dark:fill-brand-950' : 'fill-white dark:fill-zinc-900'}
      />
      <text
        x={node.x}
        y={node.y + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        className="text-xs font-medium fill-surface-700 dark:fill-zinc-300"
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
        className={isHighlighted ? 'stroke-brand-400' : 'stroke-surface-300 dark:stroke-zinc-600'}
        strokeWidth={isHighlighted ? 2 : 1.5}
        markerEnd={isHighlighted ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
      />
      {edge.label && (
        <text
          x={mid.x}
          y={mid.y - 6}
          textAnchor="middle"
          className={`text-[10px] ${isHighlighted ? 'fill-brand-600 dark:fill-brand-400' : 'fill-surface-500 dark:fill-zinc-400'}`}
        >
          {edge.label}
        </text>
      )}
    </g>
  );
}
