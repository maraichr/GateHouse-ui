import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../data/apiClient';
import { Avatar } from '../display/Avatar';
import { DateDisplay } from '../display/DateDisplay';
import { Skeleton } from '../shared/Skeleton';

interface ActivityItem {
  id?: string;
  user?: { name?: string; avatar?: string };
  action?: string;
  details?: string;
  created_at?: string;
  // flat fallback fields if no nested user object
  user_name?: string;
  user_avatar?: string;
}

interface ItemTemplate {
  avatar?: string;
  title?: string;
  subtitle?: string;
  timestamp?: string;
}

interface ActivityFeedProps {
  source: string;
  parentId?: string;
  item_template?: ItemTemplate;
}

function resolveSource(source: string, parentId?: string): string {
  if (!source) return '';
  // "api:GET /subcontractors/{{id}}/activity" → "/subcontractors/{id}/activity"
  let path = source.replace(/^api:(?:GET\s+)?/i, '');
  if (parentId) {
    path = path.replace(/\{\{id\}\}/g, parentId);
  }
  return path;
}

export function ActivityFeed({ source, parentId, item_template }: ActivityFeedProps) {
  const path = resolveSource(source, parentId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['activity-feed', path],
    queryFn: () => apiGet<ActivityItem[]>(path),
    enabled: !!path,
  });

  const items: ActivityItem[] = Array.isArray(data) ? data : (data as any)?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <span className="sr-only">Loading activity...</span>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton variant="circular" width={36} height={36} />
            <div className="flex-1 space-y-1">
              <Skeleton width="60%" height={14} />
              <Skeleton width="40%" height={12} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="text-center py-8 text-gray-400 text-sm">Unable to load activity feed.</div>;
  }

  if (items.length === 0) {
    return <div className="text-center py-8 text-gray-500 text-sm">No activity yet.</div>;
  }

  return (
    <div className="space-y-0">
      {items.map((item, i) => {
        const userName = item.user?.name || item.user_name || 'System';
        const userAvatar = item.user?.avatar || item.user_avatar;
        const action = item.action || '';
        const details = item.details || '';
        const timestamp = item.created_at || '';

        return (
          <div key={item.id || i} className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
            {/* Timeline dot + avatar */}
            <div className="flex-shrink-0 relative">
              <Avatar src={userAvatar} name={userName} size="sm" />
              {/* Connecting line */}
              {i < items.length - 1 && (
                <div className="absolute left-1/2 top-full w-px h-3 bg-gray-200 -translate-x-1/2" aria-hidden="true" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{userName}</span>
                {action && <span className="text-gray-600"> {action}</span>}
              </p>
              {details && (
                <p className="text-sm text-gray-500 mt-0.5">{details}</p>
              )}
              {timestamp && (
                <p className="text-xs text-gray-400 mt-1">
                  <DateDisplay value={timestamp} format="relative" />
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
