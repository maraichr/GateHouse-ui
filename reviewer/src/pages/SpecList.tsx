import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Upload, Plus, Calendar, Box, Layers, PenLine, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useSpecs } from '../hooks/useSpec';
import { useCompositions } from '../hooks/useComposition';
import { importSpecYaml } from '../api/specs';
import { importComposition } from '../api/compositions';
import { useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '../components/layout/PageHeader';
import { EmptyState } from '../components/utility/EmptyState';
import { Badge } from '../components/utility/Badge';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { CardSkeleton } from '../components/ui/Skeleton';
import { statusColor, statusLabel } from '../utils/coverage';
import clsx from 'clsx';

export function SpecList() {
  const { data: specs, isLoading: specsLoading } = useSpecs();
  const { data: compositions, isLoading: compsLoading } = useCompositions();
  const [activeTab, setActiveTab] = useState<'specs' | 'compositions'>('specs');
  const [importing, setImporting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleImportSpec = async () => {
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
        toast.success('Spec imported successfully');
      } catch (err) {
        toast.error(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const handleImportComposition = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.yaml,.yml';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setImporting(true);
      try {
        const text = await file.text();
        const baseDir = prompt('Base directory for spec file paths (leave empty if paths are absolute):') ?? '';
        await importComposition(text, baseDir || undefined);
        queryClient.invalidateQueries({ queryKey: ['compositions'] });
        queryClient.invalidateQueries({ queryKey: ['specs'] });
        setActiveTab('compositions');
        toast.success('Composition imported successfully');
      } catch (err) {
        toast.error(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
          <div className="flex items-center gap-2">
            {activeTab === 'compositions' && (
              <>
                <Button variant="outlined" color="primary" onClick={handleImportComposition} loading={importing} icon={<Layers className="w-4 h-4" />}>
                  Import Compose YAML
                </Button>
                <Button onClick={() => navigate('/compositions/new')} icon={<Plus className="w-4 h-4" />}>
                  New Composition
                </Button>
              </>
            )}
            <Button variant="outlined" color="neutral" onClick={handleImportSpec} loading={importing} icon={<Upload className="w-4 h-4" />}>
              Import YAML
            </Button>
            <Button onClick={() => navigate('/specs/new')} icon={<PenLine className="w-4 h-4" />}>
              New Spec
            </Button>
          </div>
        }
      />

      {/* Tab toggle */}
      <div className="flex gap-1 mb-6 bg-surface-100 dark:bg-zinc-900 rounded-xl p-1 w-fit">
        {(['specs', 'compositions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all',
              activeTab === tab
                ? 'bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100 shadow-sm'
                : 'text-surface-500 dark:text-zinc-400 hover:text-surface-700 dark:hover:text-zinc-300',
            )}
          >
            <span className="flex items-center gap-2">
              {tab === 'specs' ? <Box className="w-4 h-4" /> : <Layers className="w-4 h-4" />}
              {tab === 'specs' ? 'Specs' : 'Compositions'}
              {tab === 'specs' && specs && (
                <span className="text-xs bg-surface-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded-full">{specs.length}</span>
              )}
              {tab === 'compositions' && compositions && (
                <span className="text-xs bg-surface-200 dark:bg-zinc-700 px-1.5 py-0.5 rounded-full">{compositions.length}</span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Specs tab */}
      {activeTab === 'specs' && (
        <>
          {specsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : !specs || specs.length === 0 ? (
            <EmptyState
              title="No specs yet"
              message="Import a YAML spec file to get started"
              action={
                <Button variant="outlined" onClick={handleImportSpec} icon={<Plus className="w-4 h-4" />}>
                  Import first spec
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {specs.map((spec) => (
                <Link key={spec.id} to={`/specs/${spec.id}`}>
                  <Card hover accent="brand" className="h-full">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Box className="w-5 h-5 text-surface-400 dark:text-zinc-500" />
                        <h3 className="font-semibold text-surface-900 dark:text-zinc-100">{spec.display_name}</h3>
                      </div>
                      {spec.latest_version && (
                        <Badge color={statusColor(spec.latest_version.status)}>
                          {statusLabel(spec.latest_version.status)}
                        </Badge>
                      )}
                    </div>
                    {spec.description && (
                      <p className="text-sm text-surface-500 dark:text-zinc-400 mb-3 line-clamp-2">{spec.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-surface-400 dark:text-zinc-500">
                      {spec.latest_version && (
                        <span className="font-mono">v{spec.latest_version.version}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(spec.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Compositions tab */}
      {activeTab === 'compositions' && (
        <>
          {compsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
            </div>
          ) : !compositions || compositions.length === 0 ? (
            <EmptyState
              title="No compositions yet"
              message="Import a compose.yaml file to create a multi-service composition"
              action={
                <Button variant="outlined" onClick={handleImportComposition} icon={<Plus className="w-4 h-4" />}>
                  Import compose.yaml
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {compositions.map((comp) => (
                <Link key={comp.id} to={`/compositions/${comp.id}`}>
                  <Card hover accent="info" className="h-full">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-brand-400" />
                        <h3 className="font-semibold text-surface-900 dark:text-zinc-100">{comp.display_name}</h3>
                      </div>
                      <Badge color="indigo">{comp.member_count + 1} services</Badge>
                    </div>
                    {comp.description && (
                      <p className="text-sm text-surface-500 dark:text-zinc-400 mb-3 line-clamp-2">{comp.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs text-surface-400 dark:text-zinc-500">
                        <span>Host: {comp.host_spec_name}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(comp.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                        <Link
                          to={`/compositions/${comp.id}/edit`}
                          className="p-1 text-surface-400 hover:text-brand-600 dark:text-zinc-500 dark:hover:text-brand-400 transition-colors"
                          title="Edit"
                        >
                          <PenLine className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to={`/compositions/${comp.id}/settings`}
                          className="p-1 text-surface-400 hover:text-brand-600 dark:text-zinc-500 dark:hover:text-brand-400 transition-colors"
                          title="Settings"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
