import { useCallback, useState } from 'react';
import { useDropzone, FileRejection } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Field } from '../../../types';

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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.display_name || field.name}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
        <p className="text-sm text-gray-500">
          {isDragActive ? 'Drop images here' : 'Drag & drop images, or click to browse'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF, WebP up to 5MB</p>
      </div>

      {previews.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {previews.map((src, i) => (
            <div key={i} className="relative group">
              <img
                src={src}
                alt={value[i]?.name || `Preview ${i}`}
                className="h-24 w-full object-cover rounded-lg border border-gray-200"
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
        <p className="mt-1 text-xs text-gray-500">{field.help_text}</p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
