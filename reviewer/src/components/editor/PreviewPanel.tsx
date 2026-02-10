import { useState } from 'react';
import { X, RefreshCw, Eye } from 'lucide-react';
import { Button } from '../ui/Button';

interface PreviewPanelProps {
  specId: string;
  roles: string[];
  onClose: () => void;
}

export function PreviewPanel({ specId, roles, onClose }: PreviewPanelProps) {
  const [role, setRole] = useState(roles[0] || 'admin');
  const [key, setKey] = useState(0);

  // The preview URL points to the React renderer with draft=true
  const previewUrl = `/_renderer/preview?specId=${specId}&draft=true&role=${encodeURIComponent(role)}`;

  return (
    <div className="fixed top-0 right-0 w-[480px] h-full bg-white dark:bg-zinc-900 border-l border-surface-200 dark:border-zinc-800 shadow-xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-brand-500" />
          <h3 className="text-sm font-medium text-surface-900 dark:text-zinc-100">Preview</h3>
        </div>
        <div className="flex items-center gap-2">
          {roles.length > 0 && (
            <select
              value={role}
              onChange={(e) => { setRole(e.target.value); setKey((k) => k + 1); }}
              className="px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900"
            >
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          )}
          <Button
            variant="ghost"
            color="neutral"
            size="sm"
            onClick={() => setKey((k) => k + 1)}
            icon={<RefreshCw className="w-3 h-3" />}
          >
            Refresh
          </Button>
          <button
            onClick={onClose}
            className="p-1 text-surface-400 dark:text-zinc-500 hover:text-surface-600 dark:hover:text-zinc-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iframe */}
      <div className="flex-1 overflow-hidden">
        <iframe
          key={key}
          src={previewUrl}
          className="w-full h-full border-0"
          title="Spec Preview"
        />
      </div>
    </div>
  );
}

// Toggle button for editor toolbar
export function PreviewToggleButton({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      variant={isOpen ? 'soft' : 'outlined'}
      color="neutral"
      size="sm"
      onClick={onClick}
      icon={<Eye className="w-3.5 h-3.5" />}
    >
      Preview
    </Button>
  );
}
