import { useNavigate } from 'react-router-dom';
import { Icon } from '../../utils/icons';
import { EmptyStateConfig } from '../../types';

interface EmptyStateProps {
  config?: EmptyStateConfig;
}

export function EmptyState({ config }: EmptyStateProps) {
  const navigate = useNavigate();

  if (!config) return null;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {config.icon && (
        <Icon name={config.icon} className="h-12 w-12 text-gray-300 mb-4" />
      )}
      <h3 className="text-lg font-medium text-gray-900">{config.title}</h3>
      {config.message && (
        <p className="mt-1 text-sm text-gray-500">{config.message}</p>
      )}
      {config.action && (
        <button
          onClick={() => navigate(config.action!.path)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
        >
          {config.action.label}
        </button>
      )}
    </div>
  );
}
