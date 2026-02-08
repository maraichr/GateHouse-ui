import { useNavigate } from 'react-router-dom';
import { Icon } from '../../utils/icons';
import { EmptyStateConfig } from '../../types';
import { Button } from '../shared/Button';

interface EmptyStateProps {
  config?: EmptyStateConfig;
}

export function EmptyState({ config }: EmptyStateProps) {
  const navigate = useNavigate();

  if (!config) return null;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {config.icon && (
        <Icon name={config.icon} className="h-12 w-12 mb-4" style={{ color: 'var(--color-text-faint)' }} />
      )}
      <h3 className="text-lg font-medium" style={{ color: 'var(--color-text)' }}>{config.title}</h3>
      {config.message && (
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>{config.message}</p>
      )}
      {config.action && (
        <div className="mt-4">
          <Button variant="filled" color="primary" onClick={() => navigate(config.action!.path)}>
            {config.action.label}
          </Button>
        </div>
      )}
    </div>
  );
}
