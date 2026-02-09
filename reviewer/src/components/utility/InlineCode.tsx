interface InlineCodeProps {
  children: React.ReactNode;
}

export function InlineCode({ children }: InlineCodeProps) {
  return (
    <code className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-700 rounded font-mono">
      {children}
    </code>
  );
}
