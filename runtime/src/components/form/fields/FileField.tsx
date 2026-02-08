import { useCallback } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, X, File as FileIcon } from 'lucide-react';
import { Field } from '../../../types';
import {
  labelStyle, requiredMarkerStyle, mutedIconStyle, helpStyle, errorStyle,
  dragActiveStyle, dragIdleStyle, fileItemBgStyle,
} from '../../../utils/formTokens';

interface FileFieldProps {
  field: Field;
  value?: File[];
  onChange: (files: File[]) => void;
  error?: string;
  accept?: Record<string, string[]>;
  maxSize?: number;
}

export function FileField({ field, value = [], onChange, error, accept, maxSize }: FileFieldProps) {
  const onDrop = useCallback(
    (accepted: File[], _rejected: FileRejection[]) => {
      onChange([...value, ...accepted]);
    },
    [value, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSize || 10 * 1024 * 1024, // 10MB default
    multiple: true,
  });

  const removeFile = (index: number) => {
    const next = [...value];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={labelStyle}>
        {field.display_name || field.name}
        {field.required && <span className="ml-0.5" style={requiredMarkerStyle}>*</span>}
      </label>
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors"
        style={isDragActive ? dragActiveStyle : dragIdleStyle}
      >
        <input {...getInputProps()} />
        <Upload className="h-6 w-6 mx-auto mb-1" style={mutedIconStyle} />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {isDragActive ? 'Drop files here' : 'Drag & drop files, or click to browse'}
        </p>
      </div>

      {value.length > 0 && (
        <ul className="mt-2 space-y-1">
          {value.map((file, i) => (
            <li key={i} className="flex items-center gap-2 text-sm rounded px-2 py-1" style={fileItemBgStyle}>
              <FileIcon className="h-4 w-4 flex-shrink-0" style={mutedIconStyle} />
              <span className="truncate flex-1">{file.name}</span>
              <span className="text-xs" style={mutedIconStyle}>{formatSize(file.size)}</span>
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="transition-colors"
                style={{ color: 'var(--color-text-faint)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-danger)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-faint)'; }}
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {field.help_text && !error && (
        <p className="mt-1 text-xs" style={helpStyle}>{field.help_text}</p>
      )}
      {error && <p className="mt-1 text-xs" style={errorStyle}>{error}</p>}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
