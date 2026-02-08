import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../data/apiClient';
import { DateDisplay } from '../display/DateDisplay';
import { Icon } from '../../utils/icons';
import { Skeleton } from '../shared/Skeleton';
import { cn } from '../../utils/cn';

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

const STATE_COLORS: Record<string, string> = {
  // Greens
  approved: 'bg-green-500',
  active: 'bg-green-500',
  completed: 'bg-green-500',
  verified: 'bg-green-500',
  done: 'bg-green-500',
  resolved: 'bg-green-500',
  // Reds
  rejected: 'bg-red-500',
  terminated: 'bg-red-500',
  suspended: 'bg-red-500',
  canceled: 'bg-red-500',
  // Ambers
  pending: 'bg-amber-500',
  under_review: 'bg-amber-500',
  in_progress: 'bg-amber-500',
  past_due: 'bg-amber-500',
  // Blues
  submitted: 'bg-blue-500',
  draft: 'bg-blue-500',
  open: 'bg-blue-500',
  trialing: 'bg-blue-500',
  // Grays
  closed: 'bg-gray-400',
  inactive: 'bg-gray-400',
};

function resolveSource(source: string, parentId?: string): string {
  if (!source) return '';
  let path = source.replace(/^api:(?:GET\s+)?/i, '');
  if (parentId) {
    path = path.replace(/\{\{id\}\}/g, parentId);
  }
  return path;
}

function dotColor(state?: string): string {
  if (!state) return 'bg-gray-400';
  return STATE_COLORS[state] || 'bg-blue-500';
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
    return <div className="text-center py-8 text-gray-400 text-sm">Unable to load transition history.</div>;
  }

  if (entries.length === 0 && !show_current_state) {
    return <div className="text-center py-8 text-gray-500 text-sm">No transitions recorded.</div>;
  }

  return (
    <div className="relative">
      {/* Current state badge */}
      {show_current_state && currentState && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Current State</span>
          <span
            className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white',
              dotColor(currentState),
            )}
          >
            {humanize(currentState)}
          </span>
        </div>
      )}

      {/* Timeline */}
      <div className="relative pl-6">
        {/* Vertical line */}
        {entries.length > 0 && (
          <div className="absolute left-[5px] top-2 bottom-2 w-px bg-gray-200" aria-hidden="true" />
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
                className={cn(
                  'absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-white',
                  dotColor(toState),
                )}
                aria-hidden="true"
              />

              {/* Content */}
              <div className="ml-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900">
                    {label || (
                      <>
                        {fromState && (
                          <span className="text-gray-500">{humanize(fromState)}</span>
                        )}
                        {fromState && toState && (
                          <span className="text-gray-400 mx-1" aria-hidden="true">→</span>
                        )}
                        {toState && humanize(toState)}
                      </>
                    )}
                  </span>
                  {toState && !label && (
                    <span
                      className={cn(
                        'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-white',
                        dotColor(toState),
                      )}
                    >
                      {humanize(toState)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  {user && <span>by {user}</span>}
                  {user && ts && <span aria-hidden="true">&middot;</span>}
                  {ts && <DateDisplay value={ts} format="relative" />}
                </div>

                {entry.comment && (
                  <p className="mt-1 text-sm text-gray-600 bg-gray-50 rounded-md px-3 py-2">
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
