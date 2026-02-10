import '@fontsource-variable/inter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router/dom';
import { Toaster } from 'sonner';
import { router } from './router';
import { SpecProvider } from './context/SpecContext';
import { AuthProvider } from './context/AuthContext';
import { useHotReload } from './hooks/useHotReload';
import { LoginPage } from './pages/LoginPage';
import { useDarkMode } from './hooks/useDarkMode';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function HotReloadProvider({ children }: { children: React.ReactNode }) {
  useHotReload();
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-dot" />
          <span className="text-sm text-surface-400 dark:text-zinc-500 font-medium">Loading Studio...</span>
        </div>
      </div>
    </div>
  );
}

export function App() {
  useDarkMode(); // Initialize dark mode on mount

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700',
        }}
        richColors
        closeButton
      />
      <AuthProvider>
        {({ user, isLoading }) =>
          isLoading ? (
            <LoadingScreen />
          ) : !user ? (
            <LoginPage />
          ) : (
            <SpecProvider>
              <HotReloadProvider>
                <RouterProvider router={router} />
              </HotReloadProvider>
            </SpecProvider>
          )
        }
      </AuthProvider>
    </QueryClientProvider>
  );
}
