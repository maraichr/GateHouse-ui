import { useState } from 'react';
import { Link } from 'react-router';
import { Upload, Plus, Calendar, Box } from 'lucide-react';
import { useSpecs } from '../hooks/useSpec';
import { importSpecYaml } from '../api/specs';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/utility/EmptyState';
import { Badge } from '../components/utility/Badge';
import { statusColor, statusLabel } from '../utils/coverage';

export function SpecList() {
  const { data: specs, isLoading } = useSpecs();
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yaml,.yml';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        await importSpecYaml(text);
        queryClient.invalidateQueries({ queryKey: ['specs'] });
      } catch (err) {
        alert(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  return (
    <div>
      <PageHeader
        title="Spec Projects"
        subtitle="Review, annotate, and approve UI specifications"
        actions={
          <button
            onClick={handleImport}
            disabled={importing}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-reviewer-600 rounded-lg hover:bg-reviewer-700 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {importing ? 'Importing...' : 'Import YAML'}
          </button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : !specs || specs.length === 0 ? (
        <EmptyState
          title="No specs yet"
          message="Import a YAML spec file to get started"
          action={
            <button
              onClick={handleImport}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-reviewer-600 border border-reviewer-300 rounded-lg hover:bg-reviewer-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Import first spec
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {specs.map((spec) => (
            <Link
              key={spec.id}
              to={`/specs/${spec.id}`}
              className="bg-white rounded-lg border border-gray-200 p-5 hover:border-reviewer-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Box className="w-5 h-5 text-gray-400 group-hover:text-reviewer-500 transition-colors" />
                  <h3 className="font-semibold text-gray-900">{spec.display_name}</h3>
                </div>
                {spec.latest_version && (
                  <Badge color={statusColor(spec.latest_version.status)}>
                    {statusLabel(spec.latest_version.status)}
                  </Badge>
                )}
              </div>
              {spec.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{spec.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                {spec.latest_version && (
                  <span className="font-mono">v{spec.latest_version.version}</span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(spec.updated_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
