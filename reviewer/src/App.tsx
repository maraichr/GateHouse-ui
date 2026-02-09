import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router/dom';
import { router } from './router';
import { SpecProvider } from './context/SpecContext';
import { AuthProvider } from './context/AuthContext';
import { useHotReload } from './hooks/useHotReload';
import { LoginPage } from './pages/LoginPage';

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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-sm text-gray-400">Loading...</div>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
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
