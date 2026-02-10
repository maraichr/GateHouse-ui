import { isRouteErrorResponse, Link, useRouteError } from 'react-router';

export function RouteErrorPage() {
  const error = useRouteError();

  let title = 'Something went wrong';
  let message = 'An unexpected error occurred while loading this page.';

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = 'Page not found';
      message = 'The page you requested does not exist or the URL is incomplete.';
    } else {
      title = `${error.status} ${error.statusText}`;
      message = typeof error.data === 'string' ? error.data : message;
    }
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-xl w-full bg-white dark:bg-zinc-900 border border-surface-200 dark:border-zinc-700 rounded-xl p-6">
        <h1 className="text-xl font-semibold text-surface-900 dark:text-zinc-100">{title}</h1>
        <p className="mt-2 text-sm text-surface-500 dark:text-zinc-400">{message}</p>
        <div className="mt-5 flex items-center gap-2">
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
