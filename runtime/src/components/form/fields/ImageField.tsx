import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Field } from '../../../types';
import {
  labelStyle, requiredMarkerStyle, mutedIconStyle, helpStyle, errorStyle,
  dragActiveStyle, dragIdleStyle,
} from '../../../utils/formTokens';

interface ImageFieldProps {
  field: Field;
  value?: File[];
  onChange: (files: File[]) => void;
  error?: string;
}

export function ImageField({ field, value = [], onChange, error }: ImageFieldProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback(
    (accepted: File[], _rejected: FileRejection[]) => {
      const newFiles = [...value, ...accepted];
      onChange(newFiles);

      // Generate previews for new files
      accepted.forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          setPreviews((prev) => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    },
    [value, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
  });

  const removeFile = (index: number) => {
    const nextFiles = [...value];
    nextFiles.splice(index, 1);
    onChange(nextFiles);
    const nextPreviews = [...previews];
    nextPreviews.splice(index, 1);
    setPreviews(nextPreviews);
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
        <ImageIcon className="h-6 w-6 mx-auto mb-1" style={mutedIconStyle} />
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {isDragActive ? 'Drop images here' : 'Drag & drop images, or click to browse'}
        </p>
        <p className="text-xs mt-1" style={mutedIconStyle}>PNG, JPG, GIF, WebP up to 5MB</p>
      </div>

      {previews.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative group">
              <img
                src={src}
                alt={value[i]?.name || `Preview ${i}`}
                className="h-24 w-full object-cover rounded-lg border"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <button
                type="button"
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {field.help_text && !error && (
        <p className="mt-1 text-xs" style={helpStyle}>{field.help_text}</p>
      )}
      {error && <p className="mt-1 text-xs" style={errorStyle}>{error}</p>}
    </div>
  );
}
