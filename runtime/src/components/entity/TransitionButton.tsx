import { Icon } from '../../utils/icons';
import { Transition } from '../../types';
import { Button } from '../shared/Button';
import type { SemanticColor } from '../../utils/semanticColor';

interface TransitionButtonProps {
  transition: Transition;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
}

export function TransitionButton({ transition, onClick, disabled, tooltip }: TransitionButtonProps) {
  const color = (transition.color || 'primary') as SemanticColor;

  return (
    <Button
      variant="filled"
      color={color}
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      icon={transition.icon ? <Icon name={transition.icon} className="h-4 w-4" /> : undefined}
    >
      {transition.label}
    </Button>
  );
}
