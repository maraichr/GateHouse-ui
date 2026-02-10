import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, ArrowRight, FileText, Upload, Loader2, ChevronRight } from 'lucide-react';
import { createSpec, importSpecYaml, saveDraft } from '../../api/specs';
import type { AppSpec } from '../../types';

type Step = 'start' | 'confirm' | 'done';
type Mode = 'blank' | 'import';

const blankSpec: AppSpec = {
  app: {
    name: 'my_app',
    display_name: 'My App',
    version: '1.0.0',
    theme: {
      mode: 'light',
      primary_color: '#3b82f6',
      secondary_color: '#6b7280',
      accent_color: '#8b5cf6',
      danger_color: '#ef4444',
      success_color: '#22c55e',
      border_radius: 'md',
      density: 'comfortable',
      font_family: 'Inter, sans-serif',
    },
    i18n: {
      default_locale: 'en-US',
      date_format: 'MM/DD/YYYY',
      time_format: 'h:mm A',
      currency: 'USD',
      timezone: 'America/New_York',
    },
  },
  auth: {
    provider: 'oidc',
    config: {},
    claims_mapping: {},
    roles: {
      admin: { display_name: 'Administrator' },
      user: { display_name: 'User' },
    },
  },
  api: { base_url: '/api' },
  shell: {},
  navigation: { items: [] },
  entities: [],
  pages: [],
};

export function NewSpecWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('start');
  const [mode, setMode] = useState<Mode>('blank');
  const [appName, setAppName] = useState('my_app');
  const [displayName, setDisplayName] = useState('My App');
  const [yamlContent, setYamlContent] = useState('');
  const [importedSpec, setImportedSpec] = useState<AppSpec | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setYamlContent(text);
  };

  const handleNext = async () => {
    if (step === 'start') {
      if (mode === 'import' && !yamlContent) {
        setError('Please paste or upload a YAML file');
        return;
      }
      setError(null);
      setStep('confirm');
    } else if (step === 'confirm') {
      setCreating(true);
      setError(null);
      try {
        if (mode === 'import') {
          // Import YAML creates spec + version + composition wrapper
          const result = await importSpecYaml(yamlContent);
          const compId = (result as any).composition_id;
          if (compId) {
            navigate(`/projects/${compId}/edit`);
          } else {
            // Fallback: redirect through legacy spec route
            navigate(`/specs/${result.spec.id}/edit`);
          }
        } else {
          // Blank: create spec (auto-creates composition wrapper), then save draft
          const spec = await createSpec({
            app_name: appName,
            display_name: displayName,
          });
          const draftSpec = {
            ...blankSpec,
            app: { ...blankSpec.app, name: appName, display_name: displayName },
          };
          await saveDraft(spec.id, draftSpec);
          const compId = (spec as any).composition_id;
          if (compId) {
            navigate(`/projects/${compId}/edit`);
          } else {
            navigate(`/specs/${spec.id}/edit`);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create spec');
        setCreating(false);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-surface-500 dark:text-zinc-400 mb-6">
        <Link to="/" className="hover:text-surface-700 dark:hover:text-zinc-200">Projects</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-surface-900 dark:text-zinc-100">New Project</span>
      </nav>

      {/* Step 1: Start */}
      {step === 'start' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-zinc-100">New Project</h1>
          <p className="text-surface-500 dark:text-zinc-400">Start from scratch or import an existing YAML spec.</p>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setMode('blank')}
              className={`p-6 rounded-lg border-2 text-left transition-all ${
                mode === 'blank'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-surface-200 dark:border-zinc-700 hover:border-surface-300 dark:hover:border-zinc-600'
              }`}
            >
              <FileText className="w-8 h-8 text-brand-500 mb-3" />
              <h3 className="font-semibold text-surface-900 dark:text-zinc-100 mb-1">Blank Canvas</h3>
              <p className="text-sm text-surface-500 dark:text-zinc-400">Start with a minimal spec and build from scratch</p>
            </button>
            <button
              onClick={() => setMode('import')}
              className={`p-6 rounded-lg border-2 text-left transition-all ${
                mode === 'import'
                  ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-surface-200 dark:border-zinc-700 hover:border-surface-300 dark:hover:border-zinc-600'
              }`}
            >
              <Upload className="w-8 h-8 text-brand-500 mb-3" />
              <h3 className="font-semibold text-surface-900 dark:text-zinc-100 mb-1">Import YAML</h3>
              <p className="text-sm text-surface-500 dark:text-zinc-400">Import an existing spec file and continue editing</p>
            </button>
          </div>

          {mode === 'blank' && (
            <div className="space-y-4 bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-700 p-5">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">App Name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                  placeholder="my_app"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                  placeholder="My App"
                />
              </div>
            </div>
          )}

          {mode === 'import' && (
            <div className="space-y-3 bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-700 p-5">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Upload YAML file</label>
                <input
                  type="file"
                  accept=".yaml,.yml"
                  onChange={handleFileUpload}
                  className="text-sm text-surface-700 dark:text-zinc-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Or paste YAML</label>
                <textarea
                  value={yamlContent}
                  onChange={(e) => setYamlContent(e.target.value)}
                  rows={10}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-600 rounded-lg text-xs font-mono bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                  placeholder="app:\n  name: my_app\n  ..."
                />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-1 text-sm text-surface-500 dark:text-zinc-400 hover:text-surface-700 dark:hover:text-zinc-200">
              <ArrowLeft className="w-4 h-4" />
              Cancel
            </Link>
            <button
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-zinc-100">Confirm</h1>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-700 p-5">
            {mode === 'blank' ? (
              <div>
                <p className="text-surface-700 dark:text-zinc-300 mb-2">
                  Creating a new blank spec:
                </p>
                <dl className="space-y-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="font-medium text-surface-500 dark:text-zinc-400 w-32">Name:</dt>
                    <dd className="font-mono text-surface-900 dark:text-zinc-100">{appName}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium text-surface-500 dark:text-zinc-400 w-32">Display Name:</dt>
                    <dd className="text-surface-900 dark:text-zinc-100">{displayName}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="font-medium text-surface-500 dark:text-zinc-400 w-32">Entities:</dt>
                    <dd className="text-surface-900 dark:text-zinc-100">0 (you'll add them in the editor)</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <div>
                <p className="text-surface-700 dark:text-zinc-300 mb-2">
                  Importing YAML spec ({yamlContent.length.toLocaleString()} chars)
                </p>
                <p className="text-sm text-surface-500 dark:text-zinc-400">
                  The spec will be imported and a draft will be created for editing.
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex items-center justify-between">
            <button
              onClick={() => setStep('start')}
              className="inline-flex items-center gap-1 text-sm text-surface-500 dark:text-zinc-400 hover:text-surface-700 dark:hover:text-zinc-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={creating}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create & Open Editor'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
