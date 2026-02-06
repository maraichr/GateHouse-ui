import { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEntityDetail } from '../../data/useEntityDetail';
import { usePermissions } from '../../auth/usePermissions';
import { DetailHeader } from './DetailHeader';
import { TabLayout, Tab } from '../layout/TabLayout';
import { Section } from '../layout/Section';
import { ArrowLeft } from 'lucide-react';
import {
  Field,
  StateMachine,
  Relationship,
  DetailHeader as DetailHeaderConfig,
} from '../../types';

interface EntityDetailProps {
  entity?: string;
  api_resource?: string;
  display_name?: string;
  label_field?: string;
  status_field?: string;
  fields?: Field[];
  state_machine?: StateMachine | null;
  relationships?: Relationship[];
  layout?: string;
  children?: ReactNode;
}

export function EntityDetail({
  entity,
  api_resource,
  display_name,
  fields,
  state_machine,
  layout,
  children,
}: EntityDetailProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { data: record, isLoading, isError } = useEntityDetail(api_resource || '', id);

  // Extract header and tab nodes from children
  let headerConfig: DetailHeaderConfig | undefined;
  let tabNodes: any[] = [];

  // Iterate children to find header and tab layout nodes
  const childArray = Array.isArray(children) ? children : children ? [children] : [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {display_name || entity || 'list'}
        </button>
      </div>
      {record ? (
        <>
          <DetailHeader
            config={headerConfig}
            record={record}
            fields={fields}
            state_machine={state_machine}
          />
          <div className="flex-1">{children}</div>
        </>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-gray-500">
            Unable to load data. Connect to an API backend to see detail here.
          </p>
        </div>
      ) : (
        <div className="flex-1 p-6">
          <p className="text-gray-500">No record found</p>
        </div>
      )}
    </div>
  );
}
