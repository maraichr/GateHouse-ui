export function coverageColor(value: number): string {
  if (value >= 80) return 'green';
  if (value >= 50) return 'amber';
  return 'red';
}

export function statusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'green';
    case 'in_review':
      return 'blue';
    case 'draft':
      return 'gray';
    case 'archived':
      return 'gray';
    default:
      return 'gray';
  }
}

export function statusLabel(status: string): string {
  switch (status) {
    case 'in_review':
      return 'In Review';
    case 'approved':
      return 'Approved';
    case 'draft':
      return 'Draft';
    case 'archived':
      return 'Archived';
    default:
      return status;
  }
}
