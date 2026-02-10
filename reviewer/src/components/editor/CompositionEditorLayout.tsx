import { NavLink, Outlet, useParams, useNavigate, useBlocker, useLocation } from 'react-router';
import {
  Settings, Database, Navigation, Save, CheckCircle,
  Upload, Trash2, ArrowLeft, Layers, ChevronDown, ChevronRight, Eye, GitBranch, LayoutDashboard, FileText,
  X, RefreshCw, Download, Box,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  CompositionEditorProvider,
  useCompositionEditor,
} from '../../context/CompositionEditorContext';
import { DraftEditorProvider, useDraftEditor } from '../../context/DraftEditorContext';
import { ServiceBadge } from '../utility/ServiceBadge';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/Dialog';
import { generateMockData } from '../../api/specs';

export function CompositionEditorLayout() {
  const { compId } = useParams<{ compId: string }>();
  const { specId: urlSpecId } = useParams<{ specId: string }>();
  if (!compId) return null;

  return (
    <CompositionEditorProvider compId={compId} initialSpecId={urlSpecId}>
      {(activeSpecId) => (
        <DraftEditorProvider key={activeSpecId} specId={activeSpecId}>
          <CompositionEditorShell compId={compId} />
        </DraftEditorProvider>
      )}
    </CompositionEditorProvider>
  );
}

function CompositionEditorShell({ compId }: { compId: string }) {
  const compCtx = useCompositionEditor()!;
  const { spec, isDirty, isSaving, isLoading, lastSavedAt, error, publish, discard } = useDraftEditor();
  const navigate = useNavigate();
  const location = useLocation();
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [servicesExpanded, setServicesExpanded] = useState(true);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewRole, setPreviewRole] = useState('');
  const [previewKey, setPreviewKey] = useState(0);
  const [generating, setGenerating] = useState(false);

  const blocker = useBlocker(isDirty && !isSaving);

  const {
    composition, members, hostSpecId, hostSpecName,
    activeSpecId, isHostSpec, activeServiceName, switchService,
  } = compCtx;

  const isSingleService = members.length === 0;
  const basePath = `/projects/${compId}/edit`;

  // Are we on the composed overview (index route)?
  const isOverview = location.pathname === basePath || location.pathname === `${basePath}/`;

  // Are we viewing a specific service's editor?
  const isServiceView = location.pathname.includes('/services/');

  // Auto-navigate to host spec on mount when single-service
  useEffect(() => {
    if (isSingleService && !isServiceView && !isOverview) return;
    if (isSingleService && isOverview) {
      switchService(hostSpecId);
      navigate(`${basePath}/services/${hostSpecId}`, { replace: true });
    }
  }, [isSingleService, isOverview]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError(null);
    try {
      const { warnings } = await publish();
      if (warnings.length > 0) {
        toast.warning(`Published with warnings:\n${warnings.join('\n')}`);
      } else {
        toast.success('Published successfully');
      }
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publish failed');
    } finally {
      setPublishing(false);
    }
  };

  const handleDiscard = async () => {
    await discard();
    setConfirmDiscard(false);
  };

  const handleSwitchService = (specId: string) => {
    switchService(specId);
    navigate(`${basePath}/services/${specId}`);
  };

  const handleDownloadMockData = async () => {
    setGenerating(true);
    try {
      const data = await generateMockData(hostSpecId);
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

  if (compCtx.isLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-5 h-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        <span className="ml-2 text-surface-500 dark:text-zinc-400">Loading editor...</span>
      </div>
    );
  }

  if (!composition || !spec) {
    return (
      <div className="text-center py-12 text-surface-500 dark:text-zinc-400">
        <p>Composition or spec not available.</p>
        <button
          onClick={() => navigate(`/projects/${compId}`)}
          className="mt-4 text-brand-600 dark:text-brand-400 hover:underline"
        >
          Back to project
        </button>
      </div>
    );
  }

  // Nav items for the active spec's editor sections
  const specNavBase = `${basePath}/services/${activeSpecId}`;
  const editorNavItems = [
    { to: specNavBase, label: 'Metadata', icon: Settings, end: true },
    { to: `${specNavBase}/entities`, label: 'Entities', icon: Database },
    { to: `${specNavBase}/relationships`, label: 'Relationships', icon: GitBranch },
    { to: `${specNavBase}/navigation`, label: 'Navigation', icon: Navigation },
    { to: `${specNavBase}/pages`, label: 'Pages', icon: FileText },
  ];

  // Determine current editing context label
  const editingLabel = isSingleService
    ? (spec.app?.display_name || spec.app?.name || composition.display_name)
    : isOverview
    ? composition.display_name
    : isHostSpec
    ? `${hostSpecName} (Host)`
    : activeServiceName || 'Service';

  return (
    <div className="flex gap-6 min-h-[calc(100vh-6rem)]">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0">
        <button
          onClick={() => navigate(`/projects/${compId}`)}
          className="flex items-center gap-2 text-sm text-surface-500 dark:text-zinc-400 hover:text-surface-700 dark:hover:text-zinc-200 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to project
        </button>

        {/* Project name */}
        <div className="flex items-center gap-2 mb-4">
          {isSingleService ? (
            <Box className="w-4 h-4 text-brand-500" />
          ) : (
            <Layers className="w-4 h-4 text-indigo-500" />
          )}
          <h2 className="text-sm font-semibold text-surface-900 dark:text-zinc-100 truncate">
            {composition.display_name}
          </h2>
        </div>

        {/* Multi-service: Composed overview link + Host + Services sections */}
        {!isSingleService && (
          <>
            {/* Composed overview link */}
            <NavLink
              to={basePath}
              end
              className={({ isActive }) =>
                `w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors mb-3 ${
                  isActive
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'text-surface-600 dark:text-zinc-400 hover:bg-surface-100 dark:hover:bg-zinc-800'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              Composed Overview
            </NavLink>

            {/* Host spec */}
            <div className="mb-3">
              <h3 className="text-xs font-semibold text-surface-400 dark:text-zinc-500 uppercase tracking-wider mb-1">Host</h3>
              <button
                onClick={() => handleSwitchService(hostSpecId)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isServiceView && isHostSpec
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'text-surface-600 dark:text-zinc-400 hover:bg-surface-100 dark:hover:bg-zinc-800'
                }`}
              >
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.5 rounded">HOST</span>
                <span className="truncate">{hostSpecName}</span>
              </button>
            </div>

            {/* Services */}
            <div className="mb-4">
              <button
                onClick={() => setServicesExpanded(!servicesExpanded)}
                className="flex items-center gap-1 text-xs font-semibold text-surface-400 dark:text-zinc-500 uppercase tracking-wider mb-1 hover:text-surface-600 dark:hover:text-zinc-300"
              >
                {servicesExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Services ({members.length})
              </button>
              {servicesExpanded && (
                <div className="space-y-0.5">
                  {members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => handleSwitchService(m.spec_id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                        isServiceView && activeSpecId === m.spec_id
                          ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-400 font-medium'
                          : 'text-surface-600 dark:text-zinc-400 hover:bg-surface-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <ServiceBadge service={m.service_name} />
                      {m.optional && (
                        <span className="text-[9px] text-surface-400 dark:text-zinc-500 italic">opt</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Editor sections for active spec */}
        {isServiceView && (
          <div className={isSingleService ? '' : 'border-t border-surface-200 dark:border-zinc-800 pt-3'}>
            {!isSingleService && (
              <h3 className="text-xs font-semibold text-surface-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                Edit: {isHostSpec ? hostSpecName : activeServiceName}
              </h3>
            )}
            {isSingleService && (
              <h3 className="text-xs font-semibold text-surface-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Editor</h3>
            )}
            <nav className="space-y-0.5">
              {editorNavItems.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-400 font-medium'
                        : 'text-surface-600 dark:text-zinc-400 hover:bg-surface-100 dark:hover:bg-zinc-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}

        {/* Quick actions */}
        <div className="border-t border-surface-200 dark:border-zinc-800 pt-3 mt-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg w-full transition-colors ${
              showPreview
                ? 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-400'
                : 'text-surface-600 dark:text-zinc-400 hover:bg-surface-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          {!isSingleService && (
            <button
              onClick={() => navigate(`/projects/${compId}/settings`)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-surface-600 dark:text-zinc-400 hover:bg-surface-100 dark:hover:bg-zinc-800 rounded-lg w-full transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Top bar */}
        <div className={`${isSingleService ? 'glass rounded-xl px-5 py-3' : ''} flex items-center justify-between mb-6 ${!isSingleService ? 'pb-4 border-b border-surface-200 dark:border-zinc-800' : ''}`}>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-surface-900 dark:text-zinc-100">
              {editingLabel}
            </h1>
            {!isSingleService && isOverview ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                <Layers className="w-3 h-3" />
                All Services
              </span>
            ) : !isSingleService ? (
              <>
                {isHostSpec ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                    HOST
                  </span>
                ) : activeServiceName ? (
                  <ServiceBadge service={activeServiceName} />
                ) : null}
              </>
            ) : null}
            {(isServiceView || isSingleService) && (
              <EditorSaveIndicator isSaving={isSaving} isDirty={isDirty} lastSavedAt={lastSavedAt} />
            )}
          </div>
          {(isServiceView || isSingleService) && (
            <div className="flex items-center gap-2">
              {error && <span className="text-sm text-danger-500">{error}</span>}
              {publishError && <span className="text-sm text-danger-500">{publishError}</span>}
              {isSingleService && (
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
              )}
              <Button
                variant="outlined"
                color="neutral"
                size="sm"
                onClick={() => setConfirmDiscard(true)}
                icon={<Trash2 className="w-3.5 h-3.5" />}
              >
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handlePublish}
                loading={publishing}
                icon={<Upload className="w-3.5 h-3.5" />}
              >
                {publishing ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          )}
        </div>

        <Outlet />
      </div>

      {/* Live Preview split panel */}
      {showPreview && (
        <div className="w-[480px] flex-shrink-0 border-l border-surface-200 dark:border-zinc-800 flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-surface-200 dark:border-zinc-800 bg-surface-50 dark:bg-zinc-800/50">
            <span className="text-xs font-medium text-surface-600 dark:text-zinc-400">Live Preview</span>
            <div className="flex items-center gap-2">
              {spec && Object.keys(spec.auth?.roles || {}).length > 0 && (
                <select
                  value={previewRole}
                  onChange={(e) => setPreviewRole(e.target.value)}
                  className="text-xs px-1.5 py-0.5 border border-surface-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-900"
                >
                  <option value="">All roles</option>
                  {Object.keys(spec.auth?.roles || {}).map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              )}
              <button
                onClick={() => setPreviewKey((k) => k + 1)}
                className="p-1 text-surface-400 dark:text-zinc-500 hover:text-surface-600 dark:hover:text-zinc-300"
                title="Refresh preview"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 text-surface-400 dark:text-zinc-500 hover:text-surface-600 dark:hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <iframe
            key={previewKey}
            src={`/_renderer/preview?compId=${compId}${previewRole ? `&role=${previewRole}` : ''}`}
            className="flex-1 w-full border-0"
            title="Preview"
          />
        </div>
      )}

      {/* Navigation blocker dialog */}
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="font-semibold text-surface-900 dark:text-zinc-100 mb-2">Unsaved changes</h3>
            <p className="text-sm text-surface-600 dark:text-zinc-400 mb-4">
              You have unsaved changes to {editingLabel}. Are you sure you want to leave?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outlined"
                color="neutral"
                size="sm"
                onClick={() => blocker.reset?.()}
              >
                Stay
              </Button>
              <Button
                color="danger"
                size="sm"
                onClick={() => blocker.proceed?.()}
              >
                Leave
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Discard confirmation dialog */}
      <ConfirmDialog
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        onConfirm={handleDiscard}
        title="Discard changes"
        description="Discard all unsaved changes and revert to the last published version?"
        confirmLabel="Discard"
        confirmColor="danger"
      />
    </div>
  );
}

/** Design-token styled save indicator (unified from EditorLayout) */
function EditorSaveIndicator({
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
