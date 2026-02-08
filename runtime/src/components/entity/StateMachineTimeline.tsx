import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../data/apiClient';
import { DateDisplay } from '../display/DateDisplay';
import { Skeleton } from '../shared/Skeleton';
import { cn } from '../../utils/cn';
import type { CSSProperties } from 'react';

interface TransitionEntry {
  id?: string;
  from_state?: string;
  to_state?: string;
  transition_name?: string;
  label?: string;
  user?: string;
  user_name?: string;
  comment?: string;
  created_at?: string;
  timestamp?: string;
}

interface StateMachineTimelineProps {
  source: string;
  parentId?: string;
  show_current_state?: boolean;
  currentState?: string;
}

type StateCategory = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

const STATE_CATEGORY: Record<string, StateCategory> = {
  approved: 'success', active: 'success', completed: 'success',
  verified: 'success', done: 'success', resolved: 'success',
  rejected: 'danger', terminated: 'danger', suspended: 'danger', canceled: 'danger',
  pending: 'warning', under_review: 'warning', in_progress: 'warning', past_due: 'warning',
  submitted: 'info', draft: 'info', open: 'info', trialing: 'info',
  closed: 'neutral', inactive: 'neutral',
};

function dotStyle(state?: string): CSSProperties {
  const cat = state ? (STATE_CATEGORY[state] || 'info') : 'neutral';
  const varMap: Record<StateCategory, string> = {
    success: 'var(--color-success)', danger: 'var(--color-danger)',
    warning: 'var(--color-warning)', info: 'var(--color-info)',
    neutral: 'var(--color-text-faint)',
  };
  return { backgroundColor: varMap[cat] };
}

function resolveSource(source: string, parentId?: string): string {
  if (!source) return '';
  let path = source.replace(/^api:(?:GET\s+)?/i, '');
  if (parentId) {
    path = path.replace(/\{\{id\}\}/g, parentId);
  }
  return path;
}

function humanize(str?: string): string {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StateMachineTimeline({ source, parentId, show_current_state, currentState }: StateMachineTimelineProps) {
  const path = resolveSource(source, parentId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['state-timeline', path],
    queryFn: () => apiGet<TransitionEntry[]>(path),
    enabled: !!path,
  });

  const entries: TransitionEntry[] = Array.isArray(data) ? data : (data as any)?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <span className="sr-only">Loading timeline...</span>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton variant="circular" width={12} height={12} className="mt-1" />
            <div className="flex-1 space-y-1">
              <Skeleton width="50%" height={14} />
              <Skeleton width="30%" height={12} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-faint)' }}>Unable to load transition history.</div>;
  }

  if (entries.length === 0 && !show_current_state) {
    return <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>No transitions recorded.</div>;
  }

  return (
    <div className="relative">
      {/* Current state badge */}
      {show_current_state && currentState && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>Current State</span>
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
            style={dotStyle(currentState)}
          >
            {humanize(currentState)}
          </span>
        </div>
      )}

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        {entries.length > 0 && (
          <div className="absolute left-[5px] top-2 bottom-2 w-px" style={{ backgroundColor: 'var(--color-border)' }} aria-hidden="true" />
        )}

        {entries.map((entry, i) => {
          const ts = entry.created_at || entry.timestamp || '';
          const label = entry.label || entry.transition_name || '';
          const user = entry.user_name || entry.user || '';
          const toState = entry.to_state;
          const fromState = entry.from_state;

          return (
            <div key={entry.id || i} className="relative pb-6 last:pb-0">
              {/* Dot */}
              <div
                className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2"
                style={{ ...dotStyle(toState), borderColor: 'var(--color-surface)' }}
                aria-hidden="true"
              />

              {/* Content */}
              <div className="ml-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    {label || (
                      <>
                        {fromState && (
                          <span style={{ color: 'var(--color-text-muted)' }}>{humanize(fromState)}</span>
                        )}
                        {fromState && toState && (
                          <span className="mx-1" style={{ color: 'var(--color-text-faint)' }} aria-hidden="true">→</span>
                        )}
                        {toState && humanize(toState)}
                      </>
                    )}
                  </span>
                  {toState && !label && (
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                      style={dotStyle(toState)}
                    >
                      {humanize(toState)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {user && <span>by {user}</span>}
                  {user && ts && <span aria-hidden="true">&middot;</span>}
                  {ts && <DateDisplay value={ts} format="relative" />}
                </div>

                {entry.comment && (
                  <p className="mt-1 text-sm rounded-md px-3 py-2" style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-alt)' }}>
                    {entry.comment}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
