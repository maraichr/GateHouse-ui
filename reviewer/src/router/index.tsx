import { createBrowserRouter } from 'react-router';
import { ReviewerShell } from '../components/layout/ReviewerShell';
import { SpecLayout, CompositionLayout } from '../context/AppSpecContext';
import { SpecList } from '../pages/SpecList';
import { SpecOverview } from '../pages/SpecOverview';
import { CompositionOverview } from '../pages/CompositionOverview';
import { EntityExplorer } from '../pages/EntityExplorer';
import { EntityDetail } from '../pages/EntityDetail';
import { PermissionMatrixPage } from '../pages/PermissionMatrixPage';
import { RelationshipMapPage } from '../pages/RelationshipMapPage';
import { NavigationBlueprintPage } from '../pages/NavigationBlueprintPage';
import { PageInspectorPage } from '../pages/PageInspectorPage';
import { LivePreview } from '../pages/LivePreview';

const sharedChildren = [
  { path: 'entities', element: <EntityExplorer /> },
  { path: 'entities/:entityName', element: <EntityDetail /> },
  { path: 'permissions', element: <PermissionMatrixPage /> },
  { path: 'relationships', element: <RelationshipMapPage /> },
  { path: 'navigation', element: <NavigationBlueprintPage /> },
  { path: 'pages', element: <PageInspectorPage /> },
];

export const router = createBrowserRouter([
  {
    element: <ReviewerShell />,
    children: [
      { path: '/', element: <SpecList /> },
      // Single spec routes
      {
        path: '/specs/:specId',
        element: <SpecLayout />,
        children: [
          { index: true, element: <SpecOverview /> },
          ...sharedChildren,
          { path: 'preview', element: <LivePreview /> },
        ],
      },
      // Composition routes
      {
        path: '/compositions/:compId',
        element: <CompositionLayout />,
        children: [
          { index: true, element: <CompositionOverview /> },
          ...sharedChildren,
          { path: 'preview', element: <LivePreview /> },
        ],
      },
    ],
  },
]);
