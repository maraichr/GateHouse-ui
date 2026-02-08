import { useContext, useState, useRef, useEffect } from 'react';
import { UserCircle, Check } from 'lucide-react';
import { AuthContext } from '../../auth/AuthProvider';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'compliance_officer', label: 'Compliance Officer' },
  { value: 'viewer', label: 'Viewer' },
];

export function RoleSwitcher() {
  const { user, setRole } = useContext(AuthContext);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentRole = user.roles[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-md transition-colors"
        style={{ color: 'var(--color-text-muted)' }}
        title={`Role: ${currentRole}`}
      >
        <UserCircle size={20} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 border rounded-lg shadow-lg z-50 py-1" style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => {
                setRole(r.value);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ''; }}
            >
              <span className="w-4 flex-shrink-0">
                {currentRole === r.value && <Check size={14} />}
              </span>
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
