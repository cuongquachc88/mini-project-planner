import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import { cn } from '@/lib/utils/cn'

interface Props {
  content: string
  className?: string
}

export function MarkdownViewer({ content, className }: Props) {
  const editor = useEditor({
    extensions: [StarterKit, TaskList, TaskItem, Link],
    content: content || '',
    editable: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none',
      },
    },
  })

  if (!editor) return <div className={cn('text-sm text-slate-400', className)}>{content}</div>

  return <EditorContent editor={editor} className={cn(className)} />
}
