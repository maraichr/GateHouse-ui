import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Upload, Plus, Calendar, Box, Layers, PenLine, Settings } from 'lucide-react';
import { toast } from 'sonner';
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

export function SpecList() {
  const { data: compositions, isLoading } = useCompositions();
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
        queryClient.invalidateQueries({ queryKey: ['compositions'] });
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
        title="Projects"
        subtitle="Create, review, and manage UI specifications"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outlined" color="neutral" onClick={handleImportSpec} loading={importing} icon={<Upload className="w-4 h-4" />}>
              Import YAML
            </Button>
            <Button variant="outlined" color="primary" onClick={handleImportComposition} loading={importing} icon={<Layers className="w-4 h-4" />}>
              Import Compose YAML
            </Button>
            <Button onClick={() => navigate('/projects/new')} icon={<PenLine className="w-4 h-4" />}>
              New Project
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : !compositions || compositions.length === 0 ? (
        <EmptyState
          title="No projects yet"
          message="Create a new project or import a YAML spec to get started"
          action={
            <div className="flex gap-2">
              <Button variant="outlined" onClick={handleImportSpec} icon={<Plus className="w-4 h-4" />}>
                Import YAML
              </Button>
              <Button onClick={() => navigate('/projects/new')} icon={<PenLine className="w-4 h-4" />}>
                New Project
              </Button>
            </div>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {compositions.map((comp) => {
            const isMultiService = comp.member_count > 0;
            return (
              <Link key={comp.id} to={`/projects/${comp.id}`}>
                <Card hover accent={isMultiService ? 'info' : 'brand'} className="h-full">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isMultiService ? (
                        <Layers className="w-5 h-5 text-brand-400" />
                      ) : (
                        <Box className="w-5 h-5 text-surface-400 dark:text-zinc-500" />
                      )}
                      <h3 className="font-semibold text-surface-900 dark:text-zinc-100">{comp.display_name}</h3>
                    </div>
                    {isMultiService ? (
                      <Badge color="indigo">{comp.member_count + 1} services</Badge>
                    ) : (
                      <Badge color="blue">spec</Badge>
                    )}
                  </div>
                  {comp.description && (
                    <p className="text-sm text-surface-500 dark:text-zinc-400 mb-3 line-clamp-2">{comp.description}</p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3 text-xs text-surface-400 dark:text-zinc-500">
                      {isMultiService && <span>Host: {comp.host_spec_name}</span>}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(comp.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                      <Link
                        to={`/projects/${comp.id}/edit`}
                        className="p-1 text-surface-400 hover:text-brand-600 dark:text-zinc-500 dark:hover:text-brand-400 transition-colors"
                        title="Edit"
                      >
                        <PenLine className="w-3.5 h-3.5" />
                      </Link>
                      {isMultiService && (
                        <Link
                          to={`/projects/${comp.id}/settings`}
                          className="p-1 text-surface-400 hover:text-brand-600 dark:text-zinc-500 dark:hover:text-brand-400 transition-colors"
                          title="Settings"
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
