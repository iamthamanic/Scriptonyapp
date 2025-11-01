import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import { Button } from './ui/button';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  X 
} from 'lucide-react';
import { cn } from '../lib/utils';
import Underline from '@tiptap/extension-underline';

interface Character {
  id: string;
  name: string;
}

interface RichTextEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: string;
  onChange: (value: string) => void;
  title: string;
  characters: Character[];
}

export function RichTextEditorModal({
  isOpen,
  onClose,
  value,
  onChange,
  title,
  characters
}: RichTextEditorModalProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: {
          items: ({ query }: { query: string }) => {
            return characters
              .filter(char => 
                char.name.toLowerCase().startsWith(query.toLowerCase())
              )
              .slice(0, 5)
              .map(char => ({ id: char.id, label: char.name }));
          },
          render: () => {
            let component: any;
            let popup: any;

            return {
              onStart: (props: any) => {
                component = document.createElement('div');
                component.className = 'mention-suggestions bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 max-h-48 overflow-y-auto';

                if (props.items.length === 0) {
                  component.innerHTML = '<div class="px-3 py-2 text-sm text-gray-500">No characters found</div>';
                } else {
                  props.items.forEach((item: any, index: number) => {
                    const button = document.createElement('button');
                    button.className = cn(
                      'w-full text-left px-3 py-2 text-sm rounded hover:bg-[#6E59A5]/10 transition-colors',
                      index === props.selectedIndex && 'bg-[#6E59A5]/10'
                    );
                    button.textContent = item.label;
                    button.addEventListener('click', () => {
                      props.command({ id: item.id, label: item.label });
                    });
                    component.appendChild(button);
                  });
                }

                if (!props.clientRect) {
                  return;
                }

                popup = document.createElement('div');
                popup.style.position = 'absolute';
                popup.style.zIndex = '9999';
                popup.appendChild(component);
                document.body.appendChild(popup);

                const rect = props.clientRect();
                popup.style.top = `${rect.bottom + window.scrollY}px`;
                popup.style.left = `${rect.left + window.scrollX}px`;
              },

              onUpdate(props: any) {
                component.innerHTML = '';
                
                if (props.items.length === 0) {
                  component.innerHTML = '<div class="px-3 py-2 text-sm text-gray-500">No characters found</div>';
                } else {
                  props.items.forEach((item: any, index: number) => {
                    const button = document.createElement('button');
                    button.className = cn(
                      'w-full text-left px-3 py-2 text-sm rounded hover:bg-[#6E59A5]/10 transition-colors',
                      index === props.selectedIndex && 'bg-[#6E59A5]/10'
                    );
                    button.textContent = item.label;
                    button.addEventListener('click', () => {
                      props.command({ id: item.id, label: item.label });
                    });
                    component.appendChild(button);
                  });
                }

                if (!props.clientRect) {
                  return;
                }

                const rect = props.clientRect();
                popup.style.top = `${rect.bottom + window.scrollY}px`;
                popup.style.left = `${rect.left + window.scrollX}px`;
              },

              onKeyDown(props: any) {
                if (props.event.key === 'Escape') {
                  popup?.remove();
                  return true;
                }
                return false;
              },

              onExit() {
                popup?.remove();
              },
            };
          },
        },
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  const handleClose = () => {
    // Auto-save happens through onChange
    onClose();
  };

  const charCount = editor?.storage.characterCount?.characters() ?? editor?.getText().length ?? 0;

  if (!editor) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[75vw] max-h-[75vh] flex flex-col p-0 gap-0">
        {/* Header with Title and Close Button */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">{title}</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Toolbar */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              'h-8 w-8 p-0',
              editor.isActive('bold') && 'bg-[#6E59A5]/10'
            )}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              'h-8 w-8 p-0',
              editor.isActive('italic') && 'bg-[#6E59A5]/10'
            )}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={cn(
              'h-8 w-8 p-0',
              editor.isActive('underline') && 'bg-[#6E59A5]/10'
            )}
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={cn(
              'h-8 w-8 p-0',
              editor.isActive('heading', { level: 1 }) && 'bg-[#6E59A5]/10'
            )}
          >
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn(
              'h-8 w-8 p-0',
              editor.isActive('heading', { level: 2 }) && 'bg-[#6E59A5]/10'
            )}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn(
              'h-8 w-8 p-0',
              editor.isActive('heading', { level: 3 }) && 'bg-[#6E59A5]/10'
            )}
          >
            <Heading3 className="h-4 w-4" />
          </Button>

          <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1" />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              'h-8 w-8 p-0',
              editor.isActive('bulletList') && 'bg-[#6E59A5]/10'
            )}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              'h-8 w-8 p-0',
              editor.isActive('orderedList') && 'bg-[#6E59A5]/10'
            )}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <EditorContent editor={editor} className="rich-text-editor" />
        </div>

        {/* Character Counter */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          <p className="text-sm text-gray-500">
            {charCount} Zeichen
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
