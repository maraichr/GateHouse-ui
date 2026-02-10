import { Outlet } from 'react-router';
import { TopNav } from './TopNav';

export function ReviewerShell() {
  return (
    <div className="min-h-screen bg-surface-50 dark:bg-zinc-950">
      {/* Subtle top gradient wash */}
      <div className="fixed inset-x-0 top-0 h-64 bg-gradient-to-b from-brand-50/40 via-transparent to-transparent dark:from-brand-950/20 pointer-events-none" aria-hidden="true" />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-brand-600 focus:text-white focus:rounded-lg">
        Skip to content
      </a>
      <TopNav />
      <main id="main-content" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 animate-fade-in">
        <Outlet />
      </main>
    </div>
  );
}
