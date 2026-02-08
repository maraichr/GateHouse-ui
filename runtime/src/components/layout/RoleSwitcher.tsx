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
        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
        title={`Role: ${currentRole}`}
      >
        <UserCircle size={20} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => {
                setRole(r.value);
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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
