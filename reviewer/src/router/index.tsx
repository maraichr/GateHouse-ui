import { createBrowserRouter } from 'react-router';
import { ReviewerShell } from '../components/layout/ReviewerShell';
import { SpecLayout, CompositionLayout } from '../context/AppSpecContext';
import { SpecList } from '../pages/SpecList';
import { SpecOverview } from '../pages/SpecOverview';
import { CompositionOverview } from '../pages/CompositionOverview';
import { CompositionSettings } from '../pages/CompositionSettings';
import { EntityExplorer } from '../pages/EntityExplorer';
import { EntityDetail } from '../pages/EntityDetail';
import { PermissionMatrixPage } from '../pages/PermissionMatrixPage';
import { RelationshipMapPage } from '../pages/RelationshipMapPage';
import { NavigationBlueprintPage } from '../pages/NavigationBlueprintPage';
import { PageInspectorPage } from '../pages/PageInspectorPage';
import { LivePreview } from '../pages/LivePreview';
import { EditorLayout } from '../components/editor/EditorLayout';
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

const sharedChildren = [
  { path: 'entities', element: <EntityExplorer /> },
  { path: 'entities/:entityName', element: <EntityDetail /> },
  { path: 'permissions', element: <PermissionMatrixPage /> },
  { path: 'relationships', element: <RelationshipMapPage /> },
  { path: 'navigation', element: <NavigationBlueprintPage /> },
  { path: 'pages', element: <PageInspectorPage /> },
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
    children: [
      { path: '/', element: <SpecList /> },
      { path: '/specs/new', element: <NewSpecWizard /> },
      { path: '/compositions/new', element: <NewCompositionWizard /> },
      // Editor routes (single spec)
      {
        path: '/specs/:specId/edit',
        element: <EditorLayout />,
        children: editorChildren,
      },
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
      // Composition settings
      { path: '/compositions/:compId/settings', element: <CompositionSettings /> },
      // Composition editor routes
      {
        path: '/compositions/:compId/edit',
        element: <CompositionEditorLayout />,
        children: [
          // Default landing: composed overview (all entities, nav, theme)
          { index: true, element: <ComposedOverviewEditor /> },
          {
            path: 'services/:specId',
            children: editorChildren,
          },
        ],
      },
    ],
  },
]);
