import { useParams, Navigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { getSpecComposition } from '../../api/specs';
import { Loader2 } from 'lucide-react';

/**
 * Legacy redirect: /specs/:specId/* → /projects/:compId/*
 * Looks up the composition for a spec, then redirects.
 */
export function SpecRedirect() {
  const { specId, '*': rest } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['spec-composition', specId],
    queryFn: () => getSpecComposition(specId!),
    enabled: !!specId,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin text-brand-500" />
        <span className="ml-2 text-sm text-surface-500 dark:text-zinc-400">Redirecting...</span>
      </div>
    );
  }

  if (error || !data?.composition_id) {
    return (
      <div className="text-center py-12 text-surface-500 dark:text-zinc-400">
        <p>Could not find project for this spec.</p>
        <a href="/" className="mt-4 inline-block text-brand-600 dark:text-brand-400 hover:underline">
          Go to Projects
        </a>
      </div>
    );
  }

  const suffix = rest ? `/${rest}` : '';
  return <Navigate to={`/projects/${data.composition_id}${suffix}`} replace />;
}
