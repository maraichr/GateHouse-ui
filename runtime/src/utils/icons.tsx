import * as LucideIcons from 'lucide-react';
import { LucideProps } from 'lucide-react';

const iconNameMap: Record<string, string> = {
  'layout-dashboard': 'LayoutDashboard',
  'hard-hat': 'HardHat',
  'clipboard-list': 'ClipboardList',
  'file-text': 'FileText',
  'bar-chart-2': 'BarChart2',
  'settings': 'Settings',
  'shield-check': 'ShieldCheck',
  'help-circle': 'HelpCircle',
  'check-circle': 'CheckCircle',
  'alert-triangle': 'AlertTriangle',
  'x-circle': 'XCircle',
  'pause-circle': 'PauseCircle',
  'refresh-cw': 'RefreshCw',
  'git-branch': 'GitBranch',
  'plus': 'Plus',
  'download': 'Download',
  'upload': 'Upload',
  'clock': 'Clock',
  'info': 'Info',
  'activity': 'Activity',
  'search': 'Search',
  'chevron-down': 'ChevronDown',
  'chevron-right': 'ChevronRight',
  'chevron-left': 'ChevronLeft',
  'menu': 'Menu',
  'x': 'X',
  'star': 'Star',
  'user': 'User',
  'log-out': 'LogOut',
  'wrench': 'Wrench',
  'mail': 'Mail',
  'phone': 'Phone',
  'map-pin': 'MapPin',
  'calendar': 'Calendar',
  'dollar-sign': 'DollarSign',
  'file': 'File',
  'image': 'Image',
  'shield': 'Shield',
  'shield-x': 'ShieldX',
  'award': 'Award',
  'file-signature': 'FileSignature',
  'check': 'Check',
  'eye': 'Eye',
  'eye-off': 'EyeOff',
  'edit': 'Edit',
  'trash': 'Trash',
  'arrow-left': 'ArrowLeft',
  'arrow-right': 'ArrowRight',
  'loader': 'Loader',
  'bell': 'Bell',
};

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

export function getIcon(name: string): React.ComponentType<LucideProps> | null {
  if (!name) return null;

  const mapped = iconNameMap[name];
  const pascalName = mapped || toPascalCase(name);
  const Icon = (LucideIcons as any)[pascalName];
  return Icon || null;
}

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const IconComponent = getIcon(name);
  if (!IconComponent) return null;
  return <IconComponent {...props} />;
}
