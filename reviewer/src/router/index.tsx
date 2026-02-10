import { createBrowserRouter, Navigate } from 'react-router';
import { ReviewerShell } from '../components/layout/ReviewerShell';
import { CompositionLayout } from '../context/AppSpecContext';
import { SpecList } from '../pages/SpecList';
import { CompositionOverview } from '../pages/CompositionOverview';
import { CompositionSettings } from '../pages/CompositionSettings';
import { EntityExplorer } from '../pages/EntityExplorer';
import { EntityDetail } from '../pages/EntityDetail';
import { PermissionMatrixPage } from '../pages/PermissionMatrixPage';
import { RelationshipMapPage } from '../pages/RelationshipMapPage';
import { NavigationBlueprintPage } from '../pages/NavigationBlueprintPage';
import { PageInspectorPage } from '../pages/PageInspectorPage';
import { LivePreview } from '../pages/LivePreview';
import { PublishReportPage } from '../pages/PublishReportPage';
import { CompositionEditorLayout } from '../components/editor/CompositionEditorLayout';
import { MetadataEditor } from '../components/editor/MetadataEditor';
import { EntityListEditor } from '../components/editor/EntityListEditor';
import { EntityEditor } from '../components/editor/EntityEditor';
import { FieldEditor } from '../components/editor/FieldEditor';
import { NavigationEditor } from '../components/editor/NavigationEditor';
import { RelationshipEditor } from '../components/editor/RelationshipEditor';
import { ComposedOverviewEditor } from '../components/editor/ComposedOverviewEditor';
import { NewSpecWizard } from '../components/editor/NewSpecWizard';
import { NewCompositionWizard } from '../components/editor/NewCompositionWizard';
import { ViewsEditor } from '../components/editor/views/ViewsEditor';
import { StateMachineEditor } from '../components/editor/StateMachineEditor';
import { PagesEditor } from '../components/editor/PagesEditor';
import { PageEditor } from '../components/editor/PageEditor';
import { SpecRedirect } from '../components/utility/SpecRedirect';
import { RouteErrorPage } from '../pages/RouteErrorPage';
import { NotFoundPage } from '../pages/NotFoundPage';

const sharedChildren = [
  { path: 'entities', element: <EntityExplorer /> },
  { path: 'entities/:entityName', element: <EntityDetail /> },
  { path: 'permissions', element: <PermissionMatrixPage /> },
  { path: 'relationships', element: <RelationshipMapPage /> },
  { path: 'navigation', element: <NavigationBlueprintPage /> },
  { path: 'pages', element: <PageInspectorPage /> },
  { path: 'publish-report', element: <PublishReportPage /> },
];

const editorChildren = [
  { index: true, element: <MetadataEditor /> },
  { path: 'entities', element: <EntityListEditor /> },
  { path: 'entities/:entityIndex', element: <EntityEditor /> },
  { path: 'entities/:entityIndex/fields/:fieldIndex', element: <FieldEditor /> },
  { path: 'entities/:entityIndex/views', element: <ViewsEditor /> },
  { path: 'entities/:entityIndex/state-machine', element: <StateMachineEditor /> },
  { path: 'relationships', element: <RelationshipEditor /> },
  { path: 'navigation', element: <NavigationEditor /> },
  { path: 'pages', element: <PagesEditor /> },
  { path: 'pages/:pageIndex', element: <PageEditor /> },
];

export const router = createBrowserRouter([
  {
    element: <ReviewerShell />,
    errorElement: <RouteErrorPage />,
    children: [
      { path: '/', element: <SpecList /> },

      // New project wizards
      { path: '/projects/new', element: <NewSpecWizard /> },
      { path: '/projects/new-composition', element: <NewCompositionWizard /> },

      // Project routes (unified: all projects are compositions)
      {
        path: '/projects/:compId',
        element: <CompositionLayout />,
        children: [
          { index: true, element: <CompositionOverview /> },
          ...sharedChildren,
          { path: 'preview', element: <LivePreview /> },
        ],
      },
      { path: '/projects/:compId/settings', element: <CompositionSettings /> },
      {
        path: '/projects/:compId/edit',
        element: <CompositionEditorLayout />,
        children: [
          { index: true, element: <ComposedOverviewEditor /> },
          { path: 'services', element: <Navigate to=".." replace /> },
          {
            path: 'services/:specId',
            children: editorChildren,
          },
        ],
      },

      // Legacy redirects: /specs/:specId/* → fetch composition_id → /projects/:compId
      { path: '/specs/new', element: <Navigate to="/projects/new" replace /> },
      { path: '/specs/:specId/*', element: <SpecRedirect /> },

      // Legacy redirects: /compositions/:compId/* → /projects/:compId/*
      { path: '/compositions/new', element: <Navigate to="/projects/new-composition" replace /> },
      { path: '/compositions/:compId/*', element: <CompositionRedirect /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

/** Redirect /compositions/:compId/* to /projects/:compId/* */
function CompositionRedirect() {
  const url = window.location.pathname;
  const newUrl = url.replace(/^\/compositions\//, '/projects/');
  return <Navigate to={newUrl + window.location.search} replace />;
}
