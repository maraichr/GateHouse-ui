import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Plus, Trash2, Zap, RotateCcw } from 'lucide-react';
import { useDraftEditor } from '../../context/DraftEditorContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/Dialog';
import { TransitionEditor } from './TransitionEditor';
import { layoutStateMachine } from '../../utils/stateMachineLayout';
import type { StateMachine, Transition } from '../../types';

export function StateMachineEditor() {
  const { specId, compId, entityIndex: eiStr } = useParams<{
    specId: string;
    compId: string;
    entityIndex: string;
  }>();
  const { spec, updateEntity } = useDraftEditor();
  const [selectedTransition, setSelectedTransition] = useState<number | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const entityIndex = parseInt(eiStr || '0', 10);
  const basePath = compId && specId
    ? `/compositions/${compId}/edit/services/${specId}`
    : `/specs/${specId}/edit`;

  if (!spec || entityIndex >= spec.entities.length) {
    return <div className="text-surface-500 dark:text-zinc-400">Entity not found</div>;
  }

  const entity = spec.entities[entityIndex];
  const sm = entity.state_machine;
  const roles = Object.keys(spec.auth?.roles || {});

  // Find enum fields that could be status fields
  const enumFields = entity.fields.filter((f) => f.type === 'enum');

  const setStateMachine = (newSm: StateMachine | undefined) => {
    updateEntity(entityIndex, { ...entity, state_machine: newSm });
  };

  const handleInitialize = () => {
    // Pick the first enum field or the status_field
    const statusField = entity.status_field
      ? enumFields.find((f) => f.name === entity.status_field)
      : enumFields[0];

    if (!statusField || !statusField.values || statusField.values.length === 0) {
      // Create a minimal state machine even without enum values
      setStateMachine({
        field: statusField?.name || 'status',
        initial: 'draft',
        transitions: [],
      });
      return;
    }

    const values = statusField.values.map((v) => v.value);
    const initial = values[0];

    // Auto-generate basic sequential transitions
    const transitions: Transition[] = [];
    for (let i = 0; i < values.length - 1; i++) {
      const from = values[i];
      const to = values[i + 1];
      transitions.push({
        name: `${from}_to_${to}`,
        label: `Move to ${to.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}`,
        from: [from],
        to,
        color: i === values.length - 2 ? 'success' : undefined,
      });
    }

    setStateMachine({
      field: statusField.name,
      initial,
      transitions,
    });
  };

  const handleRemoveWorkflow = () => {
    setStateMachine(undefined);
    setConfirmRemove(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`${basePath}/entities/${entityIndex}`}
          className="p-1.5 text-surface-400 dark:text-zinc-500 hover:text-surface-600 dark:hover:text-zinc-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h2 className="text-lg font-semibold text-surface-900 dark:text-zinc-100">
          {entity.name} — Workflows
        </h2>
      </div>

      {!sm ? (
        /* Empty state */
        <Card className="text-center py-12">
          <Zap className="w-10 h-10 mx-auto text-surface-300 dark:text-zinc-600 mb-3" />
          <h3 className="text-lg font-medium text-surface-700 dark:text-zinc-300 mb-1">
            No workflow defined
          </h3>
          <p className="text-sm text-surface-400 dark:text-zinc-500 mb-4 max-w-md mx-auto">
            Add a state machine to track status transitions.
            {enumFields.length > 0
              ? ` We found ${enumFields.length} enum field${enumFields.length > 1 ? 's' : ''} that can be used as the status field.`
              : ' You\'ll need an enum field for statuses — add one first in the entity fields.'}
          </p>
          <Button onClick={handleInitialize} icon={<Zap className="w-4 h-4" />}>
            Initialize Workflow
          </Button>
        </Card>
      ) : (
        <>
          {/* Diagram */}
          <StateMachineDiagramPreview
            sm={sm}
            selectedTransition={selectedTransition}
            onSelectTransition={setSelectedTransition}
          />

          {/* Controls bar */}
          <Card padding="sm">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-surface-600 dark:text-zinc-400">Status Field</label>
                <select
                  value={sm.field}
                  onChange={(e) => setStateMachine({ ...sm, field: e.target.value })}
                  className="px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900 font-mono"
                >
                  {enumFields.map((f) => (
                    <option key={f.name} value={f.name}>{f.name}</option>
                  ))}
                  {!enumFields.some((f) => f.name === sm.field) && (
                    <option value={sm.field}>{sm.field} (custom)</option>
                  )}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-surface-600 dark:text-zinc-400">Initial State</label>
                <select
                  value={sm.initial}
                  onChange={(e) => setStateMachine({ ...sm, initial: e.target.value })}
                  className="px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                >
                  {getUniqueStates(sm).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <Button
                variant="outlined"
                color="primary"
                size="sm"
                onClick={() => {
                  const states = getUniqueStates(sm);
                  const newTransition: Transition = {
                    name: `transition_${sm.transitions.length + 1}`,
                    label: 'New Transition',
                    from: states.length > 0 ? [states[0]] : [],
                    to: states.length > 1 ? states[1] : states[0] || '',
                  };
                  setStateMachine({ ...sm, transitions: [...sm.transitions, newTransition] });
                  setSelectedTransition(sm.transitions.length);
                }}
                icon={<Plus className="w-3.5 h-3.5" />}
              >
                Add Transition
              </Button>

              <div className="flex-1" />

              <button
                onClick={() => setConfirmRemove(true)}
                className="text-xs text-surface-400 dark:text-zinc-500 hover:text-danger-500 transition-colors"
              >
                Remove Workflow
              </button>
            </div>
          </Card>

          {/* Transitions list */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-surface-700 dark:text-zinc-300">
              Transitions ({sm.transitions.length})
            </h3>

            {sm.transitions.length === 0 ? (
              <Card className="text-center py-6">
                <p className="text-sm text-surface-400 dark:text-zinc-500">
                  No transitions yet. Click "Add Transition" to define status changes.
                </p>
              </Card>
            ) : (
              sm.transitions.map((t, i) => (
                <TransitionEditor
                  key={i}
                  transition={t}
                  index={i}
                  onChange={(updated) => {
                    const transitions = [...sm.transitions];
                    transitions[i] = updated;
                    setStateMachine({ ...sm, transitions });
                  }}
                  onRemove={() => {
                    setStateMachine({
                      ...sm,
                      transitions: sm.transitions.filter((_, idx) => idx !== i),
                    });
                    if (selectedTransition === i) setSelectedTransition(null);
                  }}
                  onMoveUp={() => {
                    if (i === 0) return;
                    const transitions = [...sm.transitions];
                    [transitions[i], transitions[i - 1]] = [transitions[i - 1], transitions[i]];
                    setStateMachine({ ...sm, transitions });
                    if (selectedTransition === i) setSelectedTransition(i - 1);
                  }}
                  onMoveDown={() => {
                    if (i === sm.transitions.length - 1) return;
                    const transitions = [...sm.transitions];
                    [transitions[i], transitions[i + 1]] = [transitions[i + 1], transitions[i]];
                    setStateMachine({ ...sm, transitions });
                    if (selectedTransition === i) setSelectedTransition(i + 1);
                  }}
                  canMoveUp={i > 0}
                  canMoveDown={i < sm.transitions.length - 1}
                  allStates={getUniqueStates(sm)}
                  roles={roles}
                  isSelected={selectedTransition === i}
                  onSelect={() => setSelectedTransition(i === selectedTransition ? null : i)}
                />
              ))
            )}
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={handleRemoveWorkflow}
        title="Remove workflow"
        description="Remove the entire state machine configuration? This cannot be undone."
        confirmLabel="Remove"
        confirmColor="danger"
      />
    </div>
  );
}

// --- Helpers ---

function getUniqueStates(sm: StateMachine): string[] {
  const states = new Set<string>();
  states.add(sm.initial);
  for (const t of sm.transitions) {
    for (const f of t.from) states.add(f);
    states.add(t.to);
  }
  // Also include enum values from the field if accessible
  return Array.from(states);
}

// --- Inline SVG Diagram Preview ---

function StateMachineDiagramPreview({
  sm,
  selectedTransition,
  onSelectTransition,
}: {
  sm: StateMachine;
  selectedTransition: number | null;
  onSelectTransition: (i: number | null) => void;
}) {
  const layout = useMemo(() => {
    if (sm.transitions.length === 0 && getUniqueStates(sm).length <= 1) return null;
    try {
      return layoutStateMachine(sm);
    } catch {
      return null;
    }
  }, [sm]);

  if (!layout) {
    return (
      <Card padding="sm" className="text-center py-4">
        <p className="text-xs text-surface-400 dark:text-zinc-500">
          Add transitions to see the workflow diagram
        </p>
      </Card>
    );
  }

  return (
    <Card padding="sm">
      <h4 className="text-xs font-medium text-surface-500 dark:text-zinc-400 mb-2">Workflow Diagram</h4>
      <div className="overflow-x-auto">
        <svg
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="mx-auto"
        >
          {/* Edges */}
          {layout.edges.map((edge, i) => {
            const isSelected = edge.transitionIndex === selectedTransition;
            const points = edge.points.map((p) => `${p.x},${p.y}`).join(' ');
            return (
              <g
                key={`edge-${i}`}
                onClick={() => onSelectTransition(
                  edge.transitionIndex === selectedTransition ? null : edge.transitionIndex,
                )}
                className="cursor-pointer"
              >
                <polyline
                  points={points}
                  fill="none"
                  stroke={isSelected ? 'var(--color-primary, #3b82f6)' : '#94a3b8'}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  markerEnd={`url(#arrow${isSelected ? '-selected' : ''})`}
                />
                {edge.label && edge.points.length >= 2 && (
                  <text
                    x={(edge.points[0].x + edge.points[edge.points.length - 1].x) / 2}
                    y={(edge.points[0].y + edge.points[edge.points.length - 1].y) / 2 - 6}
                    textAnchor="middle"
                    className={`text-[10px] ${isSelected ? 'fill-brand-600 dark:fill-brand-400 font-medium' : 'fill-surface-500 dark:fill-zinc-400'}`}
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Arrow markers */}
          <defs>
            <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="none" stroke="#94a3b8" strokeWidth="1" />
            </marker>
            <marker id="arrow-selected" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <path d="M0,0 L8,3 L0,6" fill="none" stroke="var(--color-primary, #3b82f6)" strokeWidth="1" />
            </marker>
          </defs>

          {/* Nodes */}
          {layout.nodes.map((node) => (
            <g key={node.id}>
              <rect
                x={node.x - node.width / 2}
                y={node.y - node.height / 2}
                width={node.width}
                height={node.height}
                rx={8}
                className={`${
                  node.isInitial
                    ? 'fill-brand-50 stroke-brand-400 dark:fill-brand-950 dark:stroke-brand-600'
                    : 'fill-white stroke-surface-300 dark:fill-zinc-800 dark:stroke-zinc-600'
                }`}
                strokeWidth={node.isInitial ? 2 : 1.5}
              />
              <text
                x={node.x}
                y={node.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`text-xs font-medium ${
                  node.isInitial
                    ? 'fill-brand-700 dark:fill-brand-400'
                    : 'fill-surface-700 dark:fill-zinc-300'
                }`}
              >
                {node.id}
              </text>
              {node.isInitial && (
                <circle
                  cx={node.x - node.width / 2 - 8}
                  cy={node.y}
                  r={4}
                  className="fill-brand-500"
                />
              )}
            </g>
          ))}
        </svg>
      </div>
    </Card>
  );
}
