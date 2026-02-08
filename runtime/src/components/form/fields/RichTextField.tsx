import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, List, ListOrdered, Heading2, Undo, Redo } from 'lucide-react';
import { Field } from '../../../types';
import { cn } from '../../../utils/cn';
import {
  labelStyle, requiredMarkerStyle, helpStyle, errorStyle,
  toolbarBgStyle, toolbarDividerStyle,
} from '../../../utils/formTokens';

interface RichTextFieldProps {
  field: Field;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
}

export function RichTextField({ field, value, onChange, error }: RichTextFieldProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: field.placeholder || 'Start writing...' }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <div>
      <label className="block text-sm font-medium mb-1" style={labelStyle}>
        {field.display_name || field.name}
        {field.required && <span className="ml-0.5" style={requiredMarkerStyle}>*</span>}
      </label>
      <div
        className="border rounded-lg overflow-hidden focus-within:ring-2"
        style={{ borderColor: 'var(--color-border)', '--tw-ring-color': 'var(--color-primary)' } as React.CSSProperties}
      >
        <div className="flex items-center gap-0.5 px-2 py-1 border-b" style={toolbarBgStyle}>
          <ToolbarButton
            active={editor.isActive('bold')}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('italic')}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('heading', { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <div className="w-px h-4 mx-1" style={toolbarDividerStyle} />
          <ToolbarButton
            active={editor.isActive('bulletList')}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive('orderedList')}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <div className="w-px h-4 mx-1" style={toolbarDividerStyle} />
          <ToolbarButton onClick={() => editor.chain().focus().undo().run()}>
            <Undo className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().redo().run()}>
            <Redo className="h-4 w-4" />
          </ToolbarButton>
        </div>
        <EditorContent
          editor={editor}
          className="prose prose-sm max-w-none px-3 py-2 min-h-[120px] focus:outline-none"
        />
      </div>
      {field.help_text && !error && (
        <p className="mt-1 text-xs" style={helpStyle}>{field.help_text}</p>
      )}
      {error && <p className="mt-1 text-xs" style={errorStyle}>{error}</p>}
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('p-1.5 rounded transition-colors')}
      style={active
        ? { backgroundColor: 'var(--color-surface-hover)', color: 'var(--color-text)' }
        : { color: 'var(--color-text-muted)' }
      }
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)';
          e.currentTarget.style.color = 'var(--color-text-secondary)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = 'var(--color-text-muted)';
        }
      }}
    >
      {children}
    </button>
  );
}
