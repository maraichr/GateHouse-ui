import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-700 rounded-xl p-6">
        <h1 className="text-xl font-semibold text-surface-900 dark:text-zinc-100">Page not found</h1>
        <p className="mt-2 text-sm text-surface-500 dark:text-zinc-400">
          This route is not available. If you opened an edit URL manually, make sure it includes a valid service id.
        </p>
        <div className="mt-5">
          <Link
            to="/"
            className="inline-flex items-center px-3 py-2 text-sm rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            Back to Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
