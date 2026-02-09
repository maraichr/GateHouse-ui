const SERVICE_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-500' },
  { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
  { bg: 'bg-indigo-100', text: 'text-indigo-700', dot: 'bg-indigo-500' },
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
