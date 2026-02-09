import dagre from 'dagre';
import type { StateMachine } from '../types';

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isInitial: boolean;
}

export interface LayoutEdge {
  from: string;
  to: string;
  label: string;
  transitionIndex: number;
  points: { x: number; y: number }[];
}

export interface StateMachineLayout {
  nodes: LayoutNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 48;

export function layoutStateMachine(sm: StateMachine): StateMachineLayout {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'TB', nodesep: 40, ranksep: 60 });
  g.setDefaultEdgeLabel(() => ({}));

  // Collect unique states
  const states = new Set<string>();
  states.add(sm.initial);
  for (const t of sm.transitions) {
    for (const f of t.from) states.add(f);
    states.add(t.to);
  }

  // Add nodes
  for (const state of states) {
    g.setNode(state, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  // Add edges
  sm.transitions.forEach((t, idx) => {
    for (const from of t.from) {
      g.setEdge(from, t.to, { label: t.label || t.name, transitionIndex: idx });
    }
  });

  dagre.layout(g);

  const nodes: LayoutNode[] = [];
  for (const state of states) {
    const n = g.node(state);
    nodes.push({
      id: state,
      x: n.x,
      y: n.y,
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
      isInitial: state === sm.initial,
    });
  }

  const edges: LayoutEdge[] = [];
  for (const e of g.edges()) {
    const edge = g.edge(e);
    edges.push({
      from: e.v,
      to: e.w,
      label: (edge as any).label || '',
      transitionIndex: (edge as any).transitionIndex ?? -1,
      points: edge.points || [],
    });
  }

  // Calculate bounds
  const graphInfo = g.graph();
  const width = (graphInfo.width || 400) + 40;
  const height = (graphInfo.height || 300) + 40;

  return { nodes, edges, width, height };
}
