import { useMemo, useState, type ReactNode } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, ArrowRight, FileText, Upload, Loader2, ChevronRight, Sparkles } from 'lucide-react';
import { createSpec, importSpecYaml, saveDraft } from '../../api/specs';
import type { AppSpec, Entity } from '../../types';

type Step = 'start' | 'confirm';
type Mode = 'blank' | 'template' | 'import';
type TemplateId = 'ops' | 'crm' | 'hr';

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

const templates: Record<TemplateId, { label: string; description: string; entities: Entity[] }> = {
  ops: {
    label: 'Operations Starter',
    description: 'Track work orders and vendors with an approval workflow.',
    entities: [
      {
        name: 'WorkOrder',
        display_name: 'Work Order',
        display_name_plural: 'Work Orders',
        api_resource: '/work-orders',
        icon: 'clipboard-list',
        label_field: 'title',
        status_field: 'status',
        fields: [
          { name: 'id', type: 'string', primary_key: true, generated: true },
          { name: 'title', type: 'string', display_name: 'Title', required: true },
          { name: 'status', type: 'enum', display_name: 'Status', values: [
            { value: 'draft', label: 'Draft', color: 'gray' },
            { value: 'approved', label: 'Approved', color: 'green' },
          ] },
        ],
        views: {},
      },
      {
        name: 'Vendor',
        display_name: 'Vendor',
        display_name_plural: 'Vendors',
        api_resource: '/vendors',
        icon: 'building',
        label_field: 'name',
        fields: [
          { name: 'id', type: 'string', primary_key: true, generated: true },
          { name: 'name', type: 'string', display_name: 'Vendor Name', required: true },
          { name: 'category', type: 'string', display_name: 'Category' },
        ],
        views: {},
      },
    ],
  },
  crm: {
    label: 'CRM Starter',
    description: 'Manage leads and accounts with simple pipeline statuses.',
    entities: [
      {
        name: 'Lead',
        display_name: 'Lead',
        display_name_plural: 'Leads',
        api_resource: '/leads',
        icon: 'user-plus',
        label_field: 'name',
        fields: [
          { name: 'id', type: 'string', primary_key: true, generated: true },
          { name: 'name', type: 'string', display_name: 'Name', required: true },
          { name: 'email', type: 'string', display_name: 'Email' },
        ],
        views: {},
      },
      {
        name: 'Account',
        display_name: 'Account',
        display_name_plural: 'Accounts',
        api_resource: '/accounts',
        icon: 'briefcase',
        label_field: 'name',
        fields: [
          { name: 'id', type: 'string', primary_key: true, generated: true },
          { name: 'name', type: 'string', display_name: 'Account Name', required: true },
          { name: 'industry', type: 'string', display_name: 'Industry' },
        ],
        views: {},
      },
    ],
  },
  hr: {
    label: 'HR Starter',
    description: 'Track employees and leave requests with manager approvals.',
    entities: [
      {
        name: 'Employee',
        display_name: 'Employee',
        display_name_plural: 'Employees',
        api_resource: '/employees',
        icon: 'users',
        label_field: 'full_name',
        fields: [
          { name: 'id', type: 'string', primary_key: true, generated: true },
          { name: 'full_name', type: 'string', display_name: 'Full Name', required: true },
          { name: 'department', type: 'string', display_name: 'Department' },
        ],
        views: {},
      },
      {
        name: 'LeaveRequest',
        display_name: 'Leave Request',
        display_name_plural: 'Leave Requests',
        api_resource: '/leave-requests',
        icon: 'calendar',
        label_field: 'employee_name',
        status_field: 'status',
        fields: [
          { name: 'id', type: 'string', primary_key: true, generated: true },
          { name: 'employee_name', type: 'string', display_name: 'Employee', required: true },
          { name: 'status', type: 'enum', display_name: 'Status', values: [
            { value: 'pending', label: 'Pending', color: 'amber' },
            { value: 'approved', label: 'Approved', color: 'green' },
          ] },
        ],
        views: {},
      },
    ],
  },
};

function slugifyName(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'my_app';
}

export function NewSpecWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('start');
  const [mode, setMode] = useState<Mode>('template');
  const [appName, setAppName] = useState('my_app');
  const [displayName, setDisplayName] = useState('My App');
  const [yamlContent, setYamlContent] = useState('');
  const [templateId, setTemplateId] = useState<TemplateId>('ops');
  const [primaryJourneyName, setPrimaryJourneyName] = useState('Core Workflow');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedTemplate = useMemo(() => templates[templateId], [templateId]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setYamlContent(text);
  };

  const buildDraftSpec = (): AppSpec => {
    const name = slugifyName(appName);
    const journeyPageId = `${slugifyName(primaryJourneyName)}_home`;
    const journeyPath = `/${journeyPageId.replace(/_/g, '-')}`;
    const base = {
      ...blankSpec,
      studio: {
        schema_version: 'gh.studio.vnext',
        mode_defaults: { editor: 'guided' as const },
      },
      app: {
        ...blankSpec.app,
        name,
        display_name: displayName.trim() || 'My App',
      },
      journeys: [
        {
          id: slugifyName(primaryJourneyName),
          name: primaryJourneyName.trim() || 'Core Workflow',
          entry: true,
          steps: [
            {
              id: 'start',
              name: 'Start',
              page_id: journeyPageId,
            },
          ],
        },
      ],
      pages: [
        {
          id: journeyPageId,
          title: `${primaryJourneyName.trim() || 'Core Workflow'} Home`,
          path: journeyPath,
          purpose: 'flow_step',
          journey_id: slugifyName(primaryJourneyName),
          step_id: 'start',
          widgets: [],
        },
      ],
      navigation: {
        items: [
          {
            id: `${journeyPageId}_nav`,
            label: primaryJourneyName.trim() || 'Core Workflow',
            page: journeyPageId,
            path: journeyPath,
            icon: 'flag',
          },
        ],
      },
    };

    if (mode !== 'template') {
      return base;
    }

    return {
      ...base,
      entities: selectedTemplate.entities,
      navigation: {
        items: [
          ...(base.navigation?.items || []),
          ...selectedTemplate.entities.map((entity) => ({
            id: entity.name.toLowerCase(),
            label: entity.display_name_plural || entity.display_name,
            entity: entity.name,
            path: `/${entity.name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`,
          })),
        ],
      },
    };
  };

  const handleNext = async () => {
    if (step === 'start') {
      if ((mode === 'blank' || mode === 'template') && !displayName.trim()) {
        setError('Display name is required');
        return;
      }
      if (mode === 'import' && !yamlContent.trim()) {
        setError('Please paste or upload a YAML file');
        return;
      }
      setError(null);
      setStep('confirm');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      if (mode === 'import') {
        const result = await importSpecYaml(yamlContent);
        const compId = (result as { composition_id?: string }).composition_id;
        if (compId) {
          navigate(`/projects/${compId}/edit`);
        } else {
          navigate(`/specs/${result.spec.id}/edit`);
        }
        return;
      }

      const draftSpec = buildDraftSpec();
      const spec = await createSpec({
        app_name: draftSpec.app.name,
        display_name: draftSpec.app.display_name,
      });
      await saveDraft(spec.id, draftSpec);

      const compId = (spec as { composition_id?: string }).composition_id;
      if (compId) {
        navigate(`/projects/${compId}/edit`);
      } else {
        navigate(`/specs/${spec.id}/edit`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      setCreating(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <nav className="flex items-center gap-1 text-sm text-surface-500 dark:text-zinc-400 mb-6">
        <Link to="/" className="hover:text-surface-700 dark:hover:text-zinc-200">Projects</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-surface-900 dark:text-zinc-100">New Project</span>
      </nav>

      {step === 'start' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-zinc-100">Create Project</h1>
          <p className="text-surface-500 dark:text-zinc-400">Start from your primary user journey, then refine pages and data in Studio.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ModeCard
              selected={mode === 'template'}
              icon={<Sparkles className="w-8 h-8 text-brand-500 mb-3" />}
              title="Guided Starter"
              description="Best for PMs. Start from a domain template with safe defaults."
              onClick={() => setMode('template')}
            />
            <ModeCard
              selected={mode === 'blank'}
              icon={<FileText className="w-8 h-8 text-brand-500 mb-3" />}
              title="Blank Canvas"
              description="Start minimal and define entities manually."
              onClick={() => setMode('blank')}
            />
            <ModeCard
              selected={mode === 'import'}
              icon={<Upload className="w-8 h-8 text-brand-500 mb-3" />}
              title="Import YAML"
              description="Bring an existing spec and continue editing."
              onClick={() => setMode('import')}
            />
          </div>

          {(mode === 'blank' || mode === 'template') && (
            <div className="space-y-4 bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-700 p-5">
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDisplayName(value);
                    setAppName(slugifyName(value));
                  }}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                  placeholder="Acme Operations"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Primary Journey</label>
                <input
                  type="text"
                  value={primaryJourneyName}
                  onChange={(e) => setPrimaryJourneyName(e.target.value)}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-600 rounded-lg text-sm bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                  placeholder="Customer onboarding"
                />
                <p className="mt-1 text-xs text-surface-400 dark:text-zinc-500">
                  Studio scaffolds a starting page and navigation item from this journey.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">App Name (auto-generated)</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(slugifyName(e.target.value))}
                  className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-600 rounded-lg text-sm font-mono bg-white dark:bg-zinc-800 text-surface-900 dark:text-zinc-100"
                  placeholder="acme_operations"
                />
              </div>

              {mode === 'template' && (
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">Template</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(Object.keys(templates) as TemplateId[]).map((id) => {
                      const item = templates[id];
                      return (
                        <button
                          key={id}
                          onClick={() => setTemplateId(id)}
                          className={`p-3 text-left rounded-lg border transition-all ${
                            templateId === id
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                              : 'border-surface-200 dark:border-zinc-700 hover:border-surface-300 dark:hover:border-zinc-600'
                          }`}
                        >
                          <p className="font-medium text-surface-900 dark:text-zinc-100 text-sm">{item.label}</p>
                          <p className="text-xs text-surface-500 dark:text-zinc-400 mt-1">{item.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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

      {step === 'confirm' && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-surface-900 dark:text-zinc-100">Confirm Project Setup</h1>

          <div className="bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-700 p-5">
            {mode === 'import' ? (
              <div>
                <p className="text-surface-700 dark:text-zinc-300 mb-2">Importing YAML spec ({yamlContent.length.toLocaleString()} chars)</p>
                <p className="text-sm text-surface-500 dark:text-zinc-400">A draft will be created and opened directly in the editor.</p>
              </div>
            ) : (
              <dl className="space-y-1 text-sm">
                <div className="flex gap-2"><dt className="font-medium text-surface-500 dark:text-zinc-400 w-32">Display Name:</dt><dd className="text-surface-900 dark:text-zinc-100">{displayName}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-surface-500 dark:text-zinc-400 w-32">App Name:</dt><dd className="font-mono text-surface-900 dark:text-zinc-100">{slugifyName(appName)}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-surface-500 dark:text-zinc-400 w-32">Starting Point:</dt><dd className="text-surface-900 dark:text-zinc-100">{mode === 'template' ? templates[templateId].label : 'Blank Canvas'}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-surface-500 dark:text-zinc-400 w-32">Primary Journey:</dt><dd className="text-surface-900 dark:text-zinc-100">{primaryJourneyName || 'Core Workflow'}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-surface-500 dark:text-zinc-400 w-32">Entities:</dt><dd className="text-surface-900 dark:text-zinc-100">{mode === 'template' ? templates[templateId].entities.length : 0}</dd></div>
                <div className="flex gap-2"><dt className="font-medium text-surface-500 dark:text-zinc-400 w-32">Scaffolded Pages:</dt><dd className="text-surface-900 dark:text-zinc-100">1</dd></div>
              </dl>
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

function ModeCard({
  selected,
  icon,
  title,
  description,
  onClick,
}: {
  selected: boolean;
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-6 rounded-lg border-2 text-left transition-all ${
        selected
          ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
          : 'border-surface-200 dark:border-zinc-700 hover:border-surface-300 dark:hover:border-zinc-600'
      }`}
    >
      {icon}
      <h3 className="font-semibold text-surface-900 dark:text-zinc-100 mb-1">{title}</h3>
      <p className="text-sm text-surface-500 dark:text-zinc-400">{description}</p>
    </button>
  );
}
