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
    return <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-faint)' }}>Unable to load activity feed.</div>;
  }

  if (items.length === 0) {
    return <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>No activity yet.</div>;
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
          <div key={item.id || i} className="flex gap-3 py-3 border-b last:border-0" style={{ borderColor: 'var(--color-border-light)' }}>
            <div className="flex-shrink-0 relative">
              <Avatar src={userAvatar} name={userName} size="sm" />
              {i < items.length - 1 && (
                <div className="absolute left-1/2 top-full w-px h-3 -translate-x-1/2" style={{ backgroundColor: 'var(--color-border)' }} aria-hidden="true" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm" style={{ color: 'var(--color-text)' }}>
                <span className="font-medium">{userName}</span>
                {action && <span style={{ color: 'var(--color-text-secondary)' }}> {action}</span>}
              </p>
              {details && (
                <p className="text-sm mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{details}</p>
              )}
              {timestamp && (
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-faint)' }}>
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
