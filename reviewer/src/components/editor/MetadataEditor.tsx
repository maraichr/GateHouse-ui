import { useDraftEditor } from '../../context/DraftEditorContext';
import { useCompositionEditor } from '../../context/CompositionEditorContext';
import { Plus, Trash2, Lock } from 'lucide-react';
import { TagListField } from './TagListField';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

export function MetadataEditor() {
  const { spec, updateSpec } = useDraftEditor();
  const compositionCtx = useCompositionEditor();
  if (!spec) return null;

  const app = spec.app || { name: '', display_name: '', version: '', theme: {} as any, i18n: {} as any };
  const theme = app.theme || {};
  const i18n = app.i18n || {};
  const auth = spec.auth || { provider: '', config: {}, claims_mapping: {}, roles: {} };
  const roles = auth.roles || {};
  const logo = theme.logo || {};

  // Theme is locked when editing a service spec inside a composition
  const themeLocked = compositionCtx != null && !compositionCtx.isHostSpec;

  const setApp = (key: string, value: string) => {
    updateSpec((s) => ({ ...s, app: { ...s.app, [key]: value } }));
  };

  const setTheme = (key: string, value: any) => {
    updateSpec((s) => ({
      ...s,
      app: { ...s.app, theme: { ...s.app.theme, [key]: value } },
    }));
  };

  const setLogo = (key: string, value: string) => {
    updateSpec((s) => ({
      ...s,
      app: {
        ...s.app,
        theme: {
          ...s.app.theme,
          logo: { ...s.app.theme?.logo, [key]: value },
        },
      },
    }));
  };

  const setI18n = (key: string, value: string) => {
    updateSpec((s) => ({
      ...s,
      app: { ...s.app, i18n: { ...s.app.i18n, [key]: value } },
    }));
  };

  const setAuthProvider = (value: string) => {
    updateSpec((s) => ({
      ...s,
      auth: { ...s.auth, provider: value },
    }));
  };

  const addRole = () => {
    const key = `role_${Object.keys(roles).length + 1}`;
    updateSpec((s) => ({
      ...s,
      auth: {
        ...s.auth,
        roles: { ...s.auth.roles, [key]: { display_name: 'New Role' } },
      },
    }));
  };

  const updateRole = (oldKey: string, newKey: string, displayName: string) => {
    updateSpec((s) => {
      const newRoles = { ...s.auth.roles };
      if (oldKey !== newKey) {
        delete newRoles[oldKey];
      }
      newRoles[newKey] = { ...newRoles[newKey], display_name: displayName };
      return { ...s, auth: { ...s.auth, roles: newRoles } };
    });
  };

  const removeRole = (key: string) => {
    updateSpec((s) => {
      const newRoles = { ...s.auth.roles };
      delete newRoles[key];
      return { ...s, auth: { ...s.auth, roles: newRoles } };
    });
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* App section */}
      <Section title="Application">
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Name" value={app.name} onChange={(v) => setApp('name', v)} />
          <FormField label="Display Name" value={app.display_name} onChange={(v) => setApp('display_name', v)} />
          <FormField label="Version" value={app.version} onChange={(v) => setApp('version', v)} />
          <div className="col-span-2">
            <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">Description</label>
            <textarea
              value={app.description || ''}
              onChange={(e) => setApp('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>
      </Section>

      {/* Theme section */}
      <Section title="Theme">
        {themeLocked && (
          <div className="flex items-center gap-2 mb-4 p-3 bg-warning-50 dark:bg-warning-950 border border-warning-200 dark:border-warning-800 rounded-xl text-sm text-warning-800 dark:text-warning-300">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>Theme is controlled by the host spec. Edit the host to change theming.</span>
          </div>
        )}
        <div className={themeLocked ? 'opacity-60 pointer-events-none' : ''}>
          <div className="grid grid-cols-2 gap-4">
            <SelectField label="Mode" value={theme.mode || 'light'} options={['light', 'dark']} onChange={(v) => setTheme('mode', v)} />
            <SelectField label="Border Radius" value={theme.border_radius || 'md'} options={['sm', 'md', 'lg', 'full']} onChange={(v) => setTheme('border_radius', v)} />
            <SelectField label="Density" value={theme.density || 'comfortable'} options={['compact', 'comfortable', 'spacious']} onChange={(v) => setTheme('density', v)} />
            <FormField label="Font Family" value={theme.font_family || ''} onChange={(v) => setTheme('font_family', v)} />
            <SelectField label="Font Scale" value={theme.font_scale || 'md'} options={['sm', 'md', 'lg']} onChange={(v) => setTheme('font_scale', v)} />
            <SelectField label="Motion Mode" value={theme.motion_mode || 'full'} options={['full', 'reduced', 'none']} onChange={(v) => setTheme('motion_mode', v)} />
            <SelectField label="Elevation" value={theme.elevation || 'md'} options={['none', 'sm', 'md', 'lg']} onChange={(v) => setTheme('elevation', v)} />
            <SelectField label="Surface Style" value={theme.surface_style || 'bordered'} options={['flat', 'bordered', 'raised']} onChange={(v) => setTheme('surface_style', v)} />
            <SelectField label="Header Style" value={theme.header_style || 'flat'} options={['flat', 'gradient', 'accent-bar']} onChange={(v) => setTheme('header_style', v)} />
          </div>

          {/* Colors */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <ColorField label="Primary" value={theme.primary_color || '#3b82f6'} onChange={(v) => setTheme('primary_color', v)} />
            <ColorField label="Secondary" value={theme.secondary_color || '#6b7280'} onChange={(v) => setTheme('secondary_color', v)} />
            <ColorField label="Accent" value={theme.accent_color || '#8b5cf6'} onChange={(v) => setTheme('accent_color', v)} />
            <ColorField label="Danger" value={theme.danger_color || '#ef4444'} onChange={(v) => setTheme('danger_color', v)} />
            <ColorField label="Success" value={theme.success_color || '#22c55e'} onChange={(v) => setTheme('success_color', v)} />
            <ColorField label="Warning" value={theme.warning_color || '#f59e0b'} onChange={(v) => setTheme('warning_color', v)} />
            <ColorField label="Info" value={theme.info_color || '#3b82f6'} onChange={(v) => setTheme('info_color', v)} />
          </div>

          {/* Chart Palette */}
          <div className="mt-4">
            <TagListField
              label="Chart Palette"
              value={theme.chart_palette || []}
              onChange={(tags) => setTheme('chart_palette', tags)}
            />
          </div>

          {/* Logo */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-2">Logo</label>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Light" value={logo.light || ''} onChange={(v) => setLogo('light', v)} placeholder="URL or path" />
              <FormField label="Dark" value={logo.dark || ''} onChange={(v) => setLogo('dark', v)} placeholder="URL or path" />
              <FormField label="Favicon" value={logo.favicon || ''} onChange={(v) => setLogo('favicon', v)} placeholder="URL or path" />
            </div>
          </div>
        </div>
      </Section>

      {/* I18n section */}
      <Section title="Internationalization">
        <div className="grid grid-cols-2 gap-4">
          <SelectField label="Default Locale" value={i18n.default_locale || 'en-US'} options={['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'pt-BR', 'ja-JP', 'zh-CN']} onChange={(v) => setI18n('default_locale', v)} />
          <FormField label="Date Format" value={i18n.date_format || 'MM/DD/YYYY'} onChange={(v) => setI18n('date_format', v)} />
          <SelectField label="Currency" value={i18n.currency || 'USD'} options={['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'BRL']} onChange={(v) => setI18n('currency', v)} />
          <FormField label="Timezone" value={i18n.timezone || 'America/New_York'} onChange={(v) => setI18n('timezone', v)} />
        </div>
      </Section>

      {/* Auth section */}
      <Section title="Authentication">
        <div className="mb-4">
          <SelectField label="Provider" value={auth.provider || 'oidc'} options={['oidc', 'saml', 'local']} onChange={setAuthProvider} />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-surface-700 dark:text-zinc-300">Roles</label>
            <Button variant="ghost" size="sm" onClick={addRole} icon={<Plus className="w-3 h-3" />}>
              Add role
            </Button>
          </div>
          <div className="space-y-2">
            {Object.entries(roles).map(([key, role]) => (
              <div key={key} className="flex items-center gap-2">
                <input
                  type="text"
                  value={key}
                  onChange={(e) => updateRole(key, e.target.value, role.display_name)}
                  className="w-1/3 px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm font-mono bg-white dark:bg-zinc-900 text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                  placeholder="role_key"
                />
                <input
                  type="text"
                  value={role.display_name}
                  onChange={(e) => updateRole(key, key, e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
                  placeholder="Display Name"
                />
                <button
                  onClick={() => removeRole(key)}
                  className="p-1.5 text-surface-400 dark:text-zinc-500 hover:text-danger-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </Section>
    </div>
  );
}

// --- Shared form components ---

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="font-semibold text-surface-900 dark:text-zinc-100 mb-4">{title}</h2>
      {children}
    </Card>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-surface-900 dark:text-zinc-100 placeholder:text-surface-400 dark:placeholder:text-zinc-500 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-500 focus:outline-none"
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:focus:border-brand-500 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-surface-700 dark:text-zinc-300 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-surface-300 dark:border-zinc-700 cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded-lg text-sm font-mono bg-white dark:bg-zinc-900 text-surface-900 dark:text-zinc-100 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
        />
      </div>
    </div>
  );
}
