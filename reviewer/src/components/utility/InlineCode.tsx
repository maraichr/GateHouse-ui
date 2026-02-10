interface InlineCodeProps {
  children: React.ReactNode;
}

export function InlineCode({ children }: InlineCodeProps) {
  return (
    <code className="px-1.5 py-0.5 text-xs bg-surface-100 dark:bg-zinc-800 text-surface-700 dark:text-zinc-300 rounded font-mono">
      {children}
    </code>
  );
}
