import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { StateMachine, Transition } from '../../types';
import { usePermissions } from '../../auth/usePermissions';
import { useTransition } from '../../data/useTransition';
import { evaluateTemplate } from '../../utils/templateExpression';
import { evaluateGuardExpression } from '../../utils/guardEvaluator';
import { TransitionButton } from './TransitionButton';
import { TransitionForm } from './TransitionForm';
import { ConfirmationDialog } from './ConfirmationDialog';

interface TransitionActionsProps {
  stateMachine: StateMachine;
  record: Record<string, any>;
  apiResource: string;
}

interface TransitionWithGuardState {
  transition: Transition;
  guardPassed: boolean;
  guardMessage?: string;
}

export function TransitionActions({ stateMachine, record, apiResource }: TransitionActionsProps) {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = usePermissions();
  const mutation = useTransition(apiResource, id);
  const [activeTransition, setActiveTransition] = useState<Transition | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const currentState = record[stateMachine.field];

  // Build list of transitions that match the current state + permissions,
  // but keep guard-failed ones as disabled instead of hiding
  const candidates: TransitionWithGuardState[] = [];
  for (const t of stateMachine.transitions) {
    if (!t.from.includes(currentState)) continue;
    if (t.permissions && !hasPermission(t.permissions)) continue;

    let guardPassed = true;
    let guardMessage: string | undefined;
    if (t.guards) {
      for (const guard of t.guards) {
        const result = evaluateGuardExpression(guard, record);
        if (!result.passed) {
          guardPassed = false;
          guardMessage = result.message;
          break;
        }
      }
    }
    candidates.push({ transition: t, guardPassed, guardMessage });
  }

  if (!candidates.length) return null;

  const handleClick = (transition: Transition) => {
    if (transition.confirmation || transition.form?.length) {
      setFormValues({});
      setActiveTransition(transition);
    } else {
      mutation.mutate(
        { name: transition.name },
        {
          onSuccess: () => toast.success(`${transition.label} completed`),
          onError: () => toast.error('Something went wrong'),
        },
      );
    }
  };

  const handleConfirm = (comment?: string) => {
    if (!activeTransition) return;
    const payload: Record<string, any> = { ...formValues };
    if (comment) payload.comment = comment;
    mutation.mutate(
      { name: activeTransition.name, payload },
      {
        onSuccess: () => {
          toast.success(`${activeTransition.label} completed`);
          setActiveTransition(null);
        },
        onError: () => toast.error('Something went wrong'),
      },
    );
  };

  const ctx = { record, id: record?.id };

  return (
    <>
      <div className="flex items-center gap-2">
        {candidates.map(({ transition: t, guardPassed, guardMessage }) => (
          <TransitionButton
            key={t.name}
            transition={t}
            onClick={() => handleClick(t)}
            disabled={mutation.isPending || !guardPassed}
            tooltip={!guardPassed ? guardMessage : undefined}
          />
        ))}
      </div>

      {activeTransition?.confirmation && (
        <ConfirmationDialog
          open={!!activeTransition}
          onClose={() => setActiveTransition(null)}
          onConfirm={handleConfirm}
          confirmation={{
            ...activeTransition.confirmation,
            message: evaluateTemplate(activeTransition.confirmation.message, ctx),
          }}
          isLoading={mutation.isPending}
        >
          {activeTransition.form?.length ? (
            <TransitionForm
              fields={activeTransition.form}
              values={formValues}
              onChange={setFormValues}
            />
          ) : null}
        </ConfirmationDialog>
      )}
    </>
  );
}
