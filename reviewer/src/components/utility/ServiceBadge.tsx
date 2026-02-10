const SERVICE_COLORS = [
  { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  { bg: 'bg-rose-100 dark:bg-rose-900/40', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-100 dark:bg-cyan-900/40', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' },
  { bg: 'bg-orange-100 dark:bg-orange-900/40', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  { bg: 'bg-indigo-100 dark:bg-indigo-900/40', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
];

// Deterministic color assignment based on service name hash
function colorForService(service: string) {
  let hash = 0;
  for (let i = 0; i < service.length; i++) {
    hash = ((hash << 5) - hash + service.charCodeAt(i)) | 0;
  }
  return SERVICE_COLORS[Math.abs(hash) % SERVICE_COLORS.length];
}

interface ServiceBadgeProps {
  service: string;
  className?: string;
}

export function ServiceBadge({ service, className = '' }: ServiceBadgeProps) {
  const color = colorForService(service);
  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${color.bg} ${color.text} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${color.dot}`} />
      {service}
    </span>
  );
}

export { colorForService, SERVICE_COLORS };
