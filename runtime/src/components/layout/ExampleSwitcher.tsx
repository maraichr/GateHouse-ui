import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, FolderOpen } from 'lucide-react';

interface ExampleInfo {
  name: string;
}

interface ExamplesResponse {
  examples: ExampleInfo[];
  current: string;
}

export function ExampleSwitcher() {
  const [examples, setExamples] = useState<ExampleInfo[]>([]);
  const [current, setCurrent] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/_renderer/examples')
      .then((r) => r.json())
      .then((data: ExamplesResponse) => {
        const list = data.examples;
        if (Array.isArray(list) && list.length > 1) {
          setExamples(list);
          if (data.current) {
            setCurrent(data.current);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (examples.length === 0) return null;

  const switchExample = async (name: string) => {
    if (name === current || switching) return;
    setSwitching(true);
    setOpen(false);
    try {
      const res = await fetch(`/_renderer/switch?example=${encodeURIComponent(name)}`, {
        method: 'POST',
      });
      if (res.ok) {
        setCurrent(name);
        navigate('/dashboard');
      }
    } catch {
      // SSE will handle reload if successful
    } finally {
      setSwitching(false);
    }
  };

  const label = current || examples[0]?.name || 'Example';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={switching}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg transition-colors disabled:opacity-50"
        style={{ color: 'var(--color-text-secondary)' }}
        aria-label="Switch example"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <FolderOpen className="h-4 w-4" />
        <span className="max-w-[120px] truncate capitalize">{label.replace(/-/g, ' ')}</span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 top-full mt-1 w-52 border rounded-lg shadow-lg py-1 z-50"
          style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {examples.map((ex) => (
            <li key={ex.name} role="option" aria-selected={ex.name === current}>
              <button
                onClick={() => switchExample(ex.name)}
                className="w-full text-left px-3 py-2 text-sm capitalize transition-colors"
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
                style={
                  ex.name === current
                    ? { color: 'var(--color-primary)', fontWeight: 500 }
                    : { color: 'var(--color-text-secondary)' }
                }
              >
                {ex.name.replace(/-/g, ' ')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
