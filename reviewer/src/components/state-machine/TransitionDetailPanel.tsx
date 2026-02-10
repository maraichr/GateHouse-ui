import { X, Shield, AlertTriangle, FormInput } from 'lucide-react';
import { Badge } from '../utility/Badge';
import type { Transition } from '../../types';

interface TransitionDetailPanelProps {
  transition: Transition;
  onClose: () => void;
}

export function TransitionDetailPanel({ transition, onClose }: TransitionDetailPanelProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-lg border border-surface-200 dark:border-zinc-800 p-4 animate-slide-up shadow-elevation-md">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-surface-900 dark:text-zinc-100">{transition.label || transition.name}</h3>
          <p className="text-xs text-surface-500 dark:text-zinc-400 font-mono">{transition.name}</p>
        </div>
        <button onClick={onClose} className="p-1 text-surface-400 dark:text-zinc-500 hover:text-surface-600 dark:hover:text-zinc-300 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* From → To */}
      <div className="flex items-center gap-2 text-sm mb-4">
        <div className="flex gap-1">
          {transition.from.map((s) => (
            <Badge key={s} color="gray">{s}</Badge>
          ))}
        </div>
        <span className="text-surface-400 dark:text-zinc-500">→</span>
        <Badge color="blue">{transition.to}</Badge>
      </div>

      {/* Permissions */}
      {transition.permissions && transition.permissions.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 text-xs text-surface-500 dark:text-zinc-400 mb-1">
            <Shield className="w-3 h-3" />
            Permissions
          </div>
          <div className="flex gap-1 flex-wrap">
            {transition.permissions.map((p) => (
              <Badge key={p} color="purple">{p}</Badge>
            ))}
          </div>
        </div>
      )}

      {/* Guards */}
      {transition.guards && transition.guards.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1 text-xs text-surface-500 dark:text-zinc-400 mb-1">
            <AlertTriangle className="w-3 h-3" />
            Guards
          </div>
          <div className="space-y-1">
            {transition.guards.map((guard, i) => (
              <div key={i} className="text-xs p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded">
                <span className="font-medium text-amber-800 dark:text-amber-300">{guard.name}</span>
                <span className="text-amber-600 dark:text-amber-400 ml-1">— {guard.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation */}
      {transition.confirmation && (
        <div className="mb-3">
          <div className="text-xs text-surface-500 dark:text-zinc-400 mb-1">Confirmation</div>
          <div className="text-xs p-2 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded">
            <div className="font-medium text-red-800 dark:text-red-300">{transition.confirmation.title}</div>
            {transition.confirmation.message && (
              <div className="text-red-600 dark:text-red-400 mt-0.5">{transition.confirmation.message}</div>
            )}
            {transition.confirmation.require_comment && (
              <div className="mt-1"><Badge color="red">Requires comment</Badge></div>
            )}
            {transition.confirmation.type_to_confirm && (
              <div className="mt-1">
                <Badge color="red">Type "{transition.confirmation.type_to_confirm}" to confirm</Badge>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Form fields */}
      {transition.form?.fields && transition.form.fields.length > 0 && (
        <div>
          <div className="flex items-center gap-1 text-xs text-surface-500 dark:text-zinc-400 mb-1">
            <FormInput className="w-3 h-3" />
            Form Fields
          </div>
          <div className="space-y-1">
            {transition.form.fields.map((f, i) => (
              <div key={i} className="text-xs flex items-center gap-2 p-1.5 bg-surface-50 dark:bg-zinc-800/50 rounded">
                <span className="font-medium text-surface-700 dark:text-zinc-300">{f.display_name || f.name}</span>
                <Badge color="gray">{f.type}</Badge>
                {f.required && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
