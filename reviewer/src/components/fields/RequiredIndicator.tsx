interface RequiredIndicatorProps {
  required: boolean;
}

export function RequiredIndicator({ required }: RequiredIndicatorProps) {
  if (required) {
    return <span className="inline-block w-2 h-2 rounded-full bg-red-500" title="Required" />;
  }
  return <span className="inline-block w-2 h-2 rounded-full bg-gray-200" title="Optional" />;
}
