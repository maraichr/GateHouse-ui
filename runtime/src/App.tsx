import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { SpecProvider, useSpec } from './context/SpecContext';
import { AuthProvider } from './auth/AuthProvider';
import { BreadcrumbProvider } from './context/BreadcrumbContext';
import { AppShell } from './components/layout/AppShell';
import { Sidebar } from './components/layout/Sidebar';
import { SpecRouter } from './router/specRouter';
import { RenderNodeWrapper } from './renderer';
import { ComponentNode, ThemeConfig } from './types';
import { useHotReload } from './api/useHotReload';
import { themeToVars } from './utils/themeColors';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <SpecProvider>
            <BreadcrumbProvider>
              <AppContent />
            </BreadcrumbProvider>
          </SpecProvider>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { tree, isLoading, error } = useSpec();
  useHotReload();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-[color:var(--color-primary,#1E40AF)] border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-gray-600">Loading spec...</p>
        </div>
      </div>
    );
  }

  if (error || !tree) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-red-600">Failed to load spec</h2>
          <p className="mt-2 text-gray-600">{error?.message || 'Unknown error'}</p>
          <p className="mt-4 text-sm text-gray-500">
            Make sure the Go server is running on port 3000
          </p>
        </div>
      </div>
    );
  }

  const root = tree.root;
  const sidebarNode = root.children?.find((c: ComponentNode) => c.kind === 'sidebar');
  const appName = (root.props?.app_name as string) || tree.metadata.app_name;
  const theme = root.props?.theme as Partial<ThemeConfig> | undefined;
  const themeStyle = themeToVars(theme);

  return (
    <div style={themeStyle}>
      <Toaster position="top-right" richColors />
      <AppShell
        shell={root.props?.shell as any}
        entities={tree.metadata.entities}
        sidebar={
          sidebarNode && (
            <Sidebar appName={appName} theme={theme}>
              {sidebarNode.children?.map((child, i) => (
                <RenderNodeWrapper key={child.id || i} node={child} />
              ))}
            </Sidebar>
          )
        }
      >
        <SpecRouter tree={tree} />
      </AppShell>
    </div>
  );
}
