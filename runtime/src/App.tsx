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
import { themeToVars, isDarkMode } from './utils/themeColors';
import { useFocusManagement } from './utils/useFocusManagement';

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
  useFocusManagement();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: 'var(--color-bg, #f9fafb)' }}>
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-t-transparent rounded-full mx-auto" style={{ borderColor: 'var(--color-primary, #2563eb)', borderTopColor: 'transparent' }} />
          <p className="mt-4" style={{ color: 'var(--color-text-muted, #6b7280)' }}>Loading spec...</p>
        </div>
      </div>
    );
  }

  if (error || !tree) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: 'var(--color-bg, #f9fafb)' }}>
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--color-danger, #dc2626)' }}>Failed to load spec</h2>
          <p className="mt-2" style={{ color: 'var(--color-text-muted, #6b7280)' }}>{error?.message || 'Unknown error'}</p>
          <p className="mt-4 text-sm" style={{ color: 'var(--color-text-faint, #9ca3af)' }}>
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
    <div style={themeStyle} data-theme={isDarkMode(theme) ? 'dark' : 'light'}>
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
