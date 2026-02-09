import { createBrowserRouter } from 'react-router';
import { ReviewerShell } from '../components/layout/ReviewerShell';
import { SpecList } from '../pages/SpecList';
import { SpecOverview } from '../pages/SpecOverview';
import { EntityExplorer } from '../pages/EntityExplorer';
import { EntityDetail } from '../pages/EntityDetail';
import { PermissionMatrixPage } from '../pages/PermissionMatrixPage';
import { RelationshipMapPage } from '../pages/RelationshipMapPage';
import { NavigationBlueprintPage } from '../pages/NavigationBlueprintPage';
import { PageInspectorPage } from '../pages/PageInspectorPage';
import { LivePreview } from '../pages/LivePreview';

export const router = createBrowserRouter([
  {
    element: <ReviewerShell />,
    children: [
      { path: '/', element: <SpecList /> },
      { path: '/specs/:specId', element: <SpecOverview /> },
      { path: '/specs/:specId/entities', element: <EntityExplorer /> },
      { path: '/specs/:specId/entities/:entityName', element: <EntityDetail /> },
      { path: '/specs/:specId/permissions', element: <PermissionMatrixPage /> },
      { path: '/specs/:specId/relationships', element: <RelationshipMapPage /> },
      { path: '/specs/:specId/navigation', element: <NavigationBlueprintPage /> },
      { path: '/specs/:specId/pages', element: <PageInspectorPage /> },
      { path: '/specs/:specId/preview', element: <LivePreview /> },
    ],
  },
]);
