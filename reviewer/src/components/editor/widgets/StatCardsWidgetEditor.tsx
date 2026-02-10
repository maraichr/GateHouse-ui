import { Plus, Trash2 } from 'lucide-react';
import type { Widget, StatCard } from '../../../types';

const SEMANTIC_COLORS = ['primary', 'success', 'warning', 'danger', 'info', 'secondary'];

interface StatCardsWidgetEditorProps {
  widget: Widget;
  onChange: (w: Widget) => void;
  entityNames: string[];
}

export function StatCardsWidgetEditor({ widget, onChange, entityNames }: StatCardsWidgetEditorProps) {
  const cards = widget.cards || [];

  const addCard = () => {
    onChange({
      ...widget,
      cards: [...cards, { title: 'New Stat', value: '', icon: 'hash' }],
    });
  };

  const updateCard = (i: number, card: StatCard) => {
    const next = [...cards];
    next[i] = card;
    onChange({ ...widget, cards: next });
  };

  const removeCard = (i: number) => {
    onChange({ ...widget, cards: cards.filter((_, idx) => idx !== i) });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Title</label>
          <input
            type="text"
            value={widget.title || ''}
            onChange={(e) => onChange({ ...widget, title: e.target.value })}
            className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
            placeholder="Section title"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-surface-600 dark:text-zinc-400 mb-1">Columns</label>
          <select
            value={widget.layout || '4'}
            onChange={(e) => onChange({ ...widget, layout: e.target.value })}
            className="w-full px-2 py-1.5 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
          >
            <option value="2">2 columns</option>
            <option value="3">3 columns</option>
            <option value="4">4 columns</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-surface-600 dark:text-zinc-400">Cards ({cards.length})</label>
          <button
            onClick={addCard}
            className="inline-flex items-center gap-1 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300"
          >
            <Plus className="w-3 h-3" />
            Add Card
          </button>
        </div>

        {cards.map((card, i) => (
          <div key={i} className="p-2 bg-surface-50 dark:bg-zinc-800/50 rounded-lg">
            <div className="grid grid-cols-4 gap-2">
              <input
                type="text"
                value={card.title}
                onChange={(e) => updateCard(i, { ...card, title: e.target.value })}
                className="px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm bg-white dark:bg-zinc-900"
                placeholder="Title"
              />
              <input
                type="text"
                value={typeof card.value === 'string' ? card.value : String(card.value ?? '')}
                onChange={(e) => updateCard(i, { ...card, value: e.target.value })}
                className="px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
                placeholder="source or value"
              />
              <input
                type="text"
                value={card.icon || ''}
                onChange={(e) => updateCard(i, { ...card, icon: e.target.value || undefined })}
                className="px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-sm font-mono bg-white dark:bg-zinc-900"
                placeholder="icon"
              />
              <div className="flex items-center gap-1">
                <select
                  value={card.color || ''}
                  onChange={(e) => updateCard(i, { ...card, color: e.target.value || undefined })}
                  className="flex-1 px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs bg-white dark:bg-zinc-900"
                >
                  <option value="">default</option>
                  {SEMANTIC_COLORS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  onClick={() => removeCard(i)}
                  className="p-1 text-surface-400 dark:text-zinc-500 hover:text-danger-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="mt-1">
              <input
                type="text"
                value={card.link || ''}
                onChange={(e) => updateCard(i, { ...card, link: e.target.value || undefined })}
                className="w-full px-2 py-1 border border-surface-300 dark:border-zinc-700 rounded text-xs font-mono bg-white dark:bg-zinc-900"
                placeholder="Link path (optional)"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
