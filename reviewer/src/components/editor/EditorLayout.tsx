import { NavLink, Outlet, useParams, useNavigate, useBlocker } from 'react-router';
import { Settings, Database, Navigation, Save, CheckCircle, Upload, Trash2, ArrowLeft, GitBranch, FileText, Eye, Download } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { DraftEditorProvider, useDraftEditor } from '../../context/DraftEditorContext';
import { generateMockData } from '../../api/specs';
import { useState } from 'react';
import { Button } from '../ui/Button';
import { Dialog } from '../ui/Dialog';
import { Skeleton } from '../ui/Skeleton';
import { PreviewPanel } from './PreviewPanel';
import { useEditorMode } from '../../hooks/useEditorMode';

export function EditorLayout() {
  const { specId } = useParams<{ specId: string }>();
  if (!specId) return null;

  return (
    <DraftEditorProvider specId={specId}>
      <EditorShell specId={specId} />
    </DraftEditorProvider>
  );
}

function EditorShell({ specId }: { specId: string }) {
  const { spec, isDirty, isSaving, isLoading, lastSavedAt, error, publish, discard } = useDraftEditor();
  const navigate = useNavigate();
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [publishDetails, setPublishDetails] = useState<{
    warnings: string[];
    blockingErrors: string[];
    parityStatus: 'pass' | 'warn' | 'fail';
  } | null>(null);
  const { mode, setMode } = useEditorMode();

  // Block navigation when dirty
  const blocker = useBlocker(isDirty && !isSaving);

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      const result = await publish();
      if (result.blockingErrors.length > 0 || result.warnings.length > 0 || result.parityStatus !== 'pass') {
        setPublishDetails(result);
      } else {
        toast.success('Spec published successfully');
        navigate(`/specs/${specId}`);
      }
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed');
      toast.error('Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const handleDownloadMockData = async () => {
    setGenerating(true);
    try {
      const data = await generateMockData(specId);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${spec?.app?.name || 'spec'}-data.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Mock data downloaded');
    } catch {
      toast.error('Mock data generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleDiscard = async () => {
    setShowDiscardDialog(false);
    await discard();
    toast.info('Changes discarded');
  };

  if (isLoading) {
    return (
      <div className="flex gap-6 min-h-[calc(100vh-6rem)]">
        <aside className="w-56 flex-shrink-0 space-y-3">
          <Skeleton width="40%" className="h-4" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </aside>
        <div className="flex-1 space-y-4">
          <Skeleton width="50%" className="h-6" />
          <Skeleton className="h-48 rounded-xl" variant="rectangular" />
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="text-center py-12 text-surface-500 dark:text-zinc-400">
        <p>No draft available. This spec may not have a published version yet.</p>
        <button onClick={() => navigate(`/specs/${specId}`)} className="mt-4 text-brand-600 dark:text-brand-400 hover:underline">
          Back to spec
        </button>
      </div>
    );
  }

  const navItems = [
    { to: `/specs/${specId}/edit`, label: 'Metadata', icon: Settings, end: true },
    { to: `/specs/${specId}/edit/pages`, label: 'Pages', icon: FileText },
    { to: `/specs/${specId}/edit/entities`, label: 'Entities', icon: Database },
    { to: `/specs/${specId}/edit/navigation`, label: 'Navigation', icon: Navigation },
    { to: `/specs/${specId}/edit/relationships`, label: 'Relationships', icon: GitBranch },
  ];
  const progressItems = [
    { label: 'Outcome', done: Boolean(spec.app?.name && spec.app?.display_name) },
    { label: 'Pages', done: (spec.pages || []).length > 0 },
    { label: 'Data Model', done: (spec.entities || []).length > 0 },
    { label: 'Navigation', done: (spec.navigation?.items || []).length > 0 },
    {
      label: 'Relationships',
      done: (spec.entities || []).some((entity) => (entity.relationships || []).length > 0),
    },
  ];

  return (
    <div className="flex gap-6 min-h-[calc(100vh-6rem)]">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0">
        <button
          onClick={() => navigate(`/specs/${specId}`)}
          className="flex items-center gap-2 text-sm text-surface-500 dark:text-zinc-400 hover:text-surface-700 dark:hover:text-zinc-200 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to spec
        </button>

        <h2 className="text-xs font-semibold text-surface-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Editor</h2>
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700 font-medium dark:bg-brand-950 dark:text-brand-400 border-l-2 border-brand-500'
                    : 'text-surface-600 dark:text-zinc-400 hover:bg-surface-100 dark:hover:bg-zinc-800',
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        {mode === 'guided' && (
          <div className="mt-4 border-t border-surface-200 dark:border-zinc-800 pt-3">
            <h3 className="text-xs font-semibold text-surface-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Guided Flow</h3>
            <ul className="space-y-1.5">
              {progressItems.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-xs text-surface-600 dark:text-zinc-400">
                  <CheckCircle className={`w-3.5 h-3.5 ${item.done ? 'text-success-500' : 'text-surface-300 dark:text-zinc-600'}`} />
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="glass rounded-xl px-5 py-3 flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-surface-900 dark:text-zinc-100">
              {spec.app?.display_name || spec.app?.name || 'Untitled Spec'}
            </h1>
            <SaveIndicator isSaving={isSaving} isDirty={isDirty} lastSavedAt={lastSavedAt} />
            <div className="inline-flex rounded-lg border border-surface-200 dark:border-zinc-700 overflow-hidden">
              <button
                onClick={() => setMode('guided')}
                className={`px-2.5 py-1 text-xs ${mode === 'guided' ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-400' : 'text-surface-500 dark:text-zinc-400 hover:bg-surface-50 dark:hover:bg-zinc-800'}`}
              >
                Guided
              </button>
              <button
                onClick={() => setMode('expert')}
                className={`px-2.5 py-1 text-xs border-l border-surface-200 dark:border-zinc-700 ${mode === 'expert' ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-400' : 'text-surface-500 dark:text-zinc-400 hover:bg-surface-50 dark:hover:bg-zinc-800'}`}
              >
                Expert
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {error && <span className="text-sm text-danger-500">{error}</span>}
            {publishError && <span className="text-sm text-danger-500">{publishError}</span>}
            <Button
              variant="outlined"
              color="neutral"
              size="sm"
              loading={generating}
              onClick={handleDownloadMockData}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Mock Data
            </Button>
            <Button
              variant={showPreview ? 'soft' : 'outlined'}
              color="neutral"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              icon={<Eye className="w-3.5 h-3.5" />}
            >
              Preview
            </Button>
            <Button variant="outlined" color="neutral" size="sm" onClick={() => setShowDiscardDialog(true)} icon={<Trash2 className="w-3.5 h-3.5" />}>
              Discard
            </Button>
            <Button size="sm" loading={publishing} onClick={handlePublish} icon={<Upload className="w-3.5 h-3.5" />}>
              Publish
            </Button>
          </div>
        </div>

        <Outlet />
      </div>

      {/* Preview panel */}
      {showPreview && (
        <PreviewPanel
          specId={specId}
          roles={Object.keys(spec.auth?.roles || {})}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Discard confirmation dialog */}
      <Dialog
        open={showDiscardDialog}
        onClose={() => setShowDiscardDialog(false)}
        title="Discard changes?"
        description="This will revert all unsaved changes to the last published version."
        size="sm"
        actions={
          <>
            <Button variant="ghost" color="neutral" onClick={() => setShowDiscardDialog(false)}>Cancel</Button>
            <Button color="danger" onClick={handleDiscard}>Discard</Button>
          </>
        }
      />

      <Dialog
        open={publishDetails !== null}
        onClose={() => setPublishDetails(null)}
        title="Publish summary"
        description={
          publishDetails?.parityStatus === 'fail'
            ? 'Published with parity blockers. Resolve before production rollout.'
            : publishDetails?.parityStatus === 'warn'
              ? 'Published with warnings.'
              : 'Published successfully.'
        }
        size="md"
        actions={
          <>
            <Button variant="ghost" color="neutral" onClick={() => setPublishDetails(null)}>Stay in editor</Button>
            <Button
              onClick={() => {
                setPublishDetails(null);
                navigate(`/specs/${specId}`);
              }}
            >
              Go to overview
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm">
          {(publishDetails?.blockingErrors || []).length > 0 && (
            <div>
              <p className="font-medium text-danger-600 dark:text-danger-400 mb-1">Blocking errors</p>
              <ul className="list-disc pl-5 text-danger-600 dark:text-danger-400">
                {publishDetails?.blockingErrors.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
          {(publishDetails?.warnings || []).length > 0 && (
            <div>
              <p className="font-medium text-warning-600 dark:text-warning-400 mb-1">Warnings</p>
              <ul className="list-disc pl-5 text-warning-600 dark:text-warning-400">
                {publishDetails?.warnings.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      </Dialog>

      {/* Navigation blocker dialog */}
      <Dialog
        open={blocker.state === 'blocked'}
        onClose={() => blocker.reset?.()}
        title="Unsaved changes"
        description="You have unsaved changes. Are you sure you want to leave?"
        size="sm"
        actions={
          <>
            <Button variant="outlined" color="neutral" onClick={() => blocker.reset?.()}>Stay</Button>
            <Button color="danger" onClick={() => blocker.proceed?.()}>Leave</Button>
          </>
        }
      />
    </div>
  );
}

function SaveIndicator({
  isSaving,
  isDirty,
  lastSavedAt,
}: {
  isSaving: boolean;
  isDirty: boolean;
  lastSavedAt: Date | null;
}) {
  if (isSaving) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-surface-400 dark:text-zinc-500 animate-fade-in">
        <span className="w-2 h-2 rounded-full bg-brand-500 animate-spin-slow" />
        Saving...
      </span>
    );
  }
  if (isDirty) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-warning-500 animate-fade-in">
        <span className="w-2 h-2 rounded-full bg-warning-500 animate-pulse-dot" />
        Unsaved
      </span>
    );
  }
  if (lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-success-500 animate-fade-in">
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" className="stroke-success-500" strokeWidth="1.5" fill="none" />
          <path
            d="M5 8l2 2 4-4"
            className="stroke-success-500 animate-checkmark"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ strokeDasharray: 24, strokeDashoffset: 0 }}
          />
        </svg>
        Saved
      </span>
    );
  }
  return null;
}
