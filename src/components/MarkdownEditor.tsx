import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import {
  Bold, Italic, List, ListOrdered, CheckSquare,
  Heading2, Code, Link2, Undo, Redo,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface Props {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  minHeight?: number
}

export function MarkdownEditor({ value, onChange, placeholder = 'Write something…', className, minHeight = 200 }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: false }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none focus:outline-none px-4 py-3',
      },
    },
  })

  if (!editor) return null

  const ToolBtn = ({ onClick, active, title, children }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded text-xs transition-colors',
        active ? 'bg-brand-500/30 text-brand-300' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700',
      )}
    >
      {children}
    </button>
  )

  return (
    <div className={cn('border border-slate-600 rounded-lg overflow-hidden bg-slate-700/50', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-600 bg-slate-800 flex-wrap">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold size={13} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic size={13} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading">
          <Heading2 size={13} />
        </ToolBtn>
        <div className="w-px h-4 bg-slate-600 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List size={13} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <ListOrdered size={13} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleTaskList().run()} active={editor.isActive('taskList')} title="Task list">
          <CheckSquare size={13} />
        </ToolBtn>
        <div className="w-px h-4 bg-slate-600 mx-1" />
        <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code">
          <Code size={13} />
        </ToolBtn>
        <ToolBtn
          onClick={() => {
            const url = window.prompt('URL')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          active={editor.isActive('link')}
          title="Link"
        >
          <Link2 size={13} />
        </ToolBtn>
        <div className="flex-1" />
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo size={13} />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo size={13} />
        </ToolBtn>
      </div>
      <EditorContent editor={editor} style={{ minHeight }} />
    </div>
  )
}
