import { useState } from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-lg',
};

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = name
    ? name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={cn('rounded-full object-cover', sizeClasses[size])}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium',
        sizeClasses[size]
      )}
    >
      {initials}
    </div>
  );
}
