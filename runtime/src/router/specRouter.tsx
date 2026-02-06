import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ComponentNode, ComponentTree } from '../types';
import { RenderNodeWrapper } from '../renderer';

interface SpecRouterProps {
  tree: ComponentTree;
}

export function SpecRouter({ tree }: SpecRouterProps) {
  const routes = extractRoutes(tree.root);

  return (
    <Routes>
      {routes.map((r) => (
        <Route
          key={r.path}
          path={r.path}
          element={
            <React.Suspense fallback={<PageSkeleton />}>
              <RenderNodeWrapper node={r.node} />
            </React.Suspense>
          }
        />
      ))}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

interface RouteConfig {
  path: string;
  node: ComponentNode;
}

function extractRoutes(root: ComponentNode): RouteConfig[] {
  const routes: RouteConfig[] = [];

  for (const child of root.children || []) {
    if (child.scope?.route) {
      routes.push({ path: child.scope.route, node: child });
    }
  }

  return routes;
}

function PageSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="animate-pulse bg-gray-200 rounded h-8 w-64" />
      <div className="animate-pulse bg-gray-100 rounded h-64" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900">Page not found</h2>
        <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
      </div>
    </div>
  );
}
