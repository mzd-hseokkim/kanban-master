import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import { memberService } from '../../services/memberService';
import { BoardMember } from '../../types/member';
import RichTextEditor, { RichTextEditorProps } from '../RichTextEditor';
import { Avatar } from './Avatar';

// Mention Blot 정의
const Inline = Quill.import('blots/inline') as any;

class MentionBlot extends Inline {
  static blotName: string;
  static tagName: string;
  static className: string;

  static create(data: { userId: string }) {
    const node = super.create();
    node.setAttribute('class', 'mention');
    node.setAttribute('data-user-id', data.userId);
    // Prevent cursor from entering the span and editing text
    node.setAttribute('contenteditable', 'false');
    return node;
  }

  static formats(node: HTMLElement) {
    return {
      userId: node.getAttribute('data-user-id'),
    };
  }
}

MentionBlot.blotName = 'mention';
MentionBlot.tagName = 'span';
MentionBlot.className = 'mention';

Quill.register(MentionBlot);

interface MentionInputProps extends RichTextEditorProps {
  boardId: number;
}

export const MentionInput: React.FC<MentionInputProps> = ({ boardId, onChange, ...props }) => {
  const quillRef = useRef<ReactQuill>(null);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  const isSelectingRef = useRef(false);

  useEffect(() => {
    loadMembers();
  }, [boardId]);

  const loadMembers = async () => {
    try {
      const data = await memberService.getBoardMembers(boardId);
      setMembers(data);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const filteredMembers = members.filter(member =>
    member.userName.toLowerCase().includes(mentionQuery.toLowerCase()) ||
    member.userEmail.toLowerCase().includes(mentionQuery.toLowerCase())
  );

  const checkMention = useCallback(() => {
    if (isSelectingRef.current) return;

    const editor = quillRef.current?.getEditor();
    if (!editor) return;

    // Use setTimeout to ensure we get the latest selection after the change event
    setTimeout(() => {
        if (isSelectingRef.current) return;

        const selection = editor.getSelection();
        if (!selection) {
            setShowMentions(false);
            return;
        }

        const cursorIndex = selection.index;
        const text = editor.getText();

        // Look backwards from cursor for @
        let i = cursorIndex - 1;
        let foundAt = false;
        let query = '';

        while (i >= 0) {
            const char = text[i];
            if (char === '@') {
                // Check if @ is at start or preceded by whitespace
                if (i === 0 || /\s/.test(text[i - 1])) {
                    foundAt = true;
                    break;
                }
            }
            if (char === ' ' || char === '\n') {
                break;
            }
            query = char + query;
            i--;
        }

        if (foundAt) {
            setMentionIndex(i);
            setMentionQuery(query);
            setShowMentions(true);

            const bounds = editor.getBounds(i);
            if (bounds) {
                // Adjust position relative to the container
                // Add more offset to top to ensure it appears below the text line
                setPopupPosition({ top: bounds.bottom + 20, left: bounds.left });
            }
            setSelectedIndex(0);
        } else {
            setShowMentions(false);
        }
    }, 0);
  }, []);

  const handleChange = useCallback((content: string) => {
    onChange(content);
    checkMention();
  }, [onChange, checkMention]);

  const handleSelectMember = (member: BoardMember) => {
    isSelectingRef.current = true;
    const editor = quillRef.current?.getEditor();
    if (!editor) {
        isSelectingRef.current = false;
        return;
    }

    // Delete @query
    editor.deleteText(mentionIndex, mentionQuery.length + 1);

    // Insert mention using Blot
    const mentionText = `@${member.userName}`;
    editor.insertText(mentionIndex, mentionText, 'mention', { userId: member.userId });

    // Move cursor after the mention and insert a space
    const nextIndex = mentionIndex + mentionText.length;
    editor.insertText(nextIndex, ' ');
    // Explicitly remove mention format from the inserted space
    editor.formatText(nextIndex, 1, 'mention', false);

    editor.setSelection(nextIndex + 1, 0);

    setShowMentions(false);

    // Reset selecting flag after a short delay to allow onChange to fire without triggering checkMention
    setTimeout(() => {
        isSelectingRef.current = false;
    }, 100);
  };

  useEffect(() => {
      const editor = quillRef.current?.getEditor();
      if (!editor) return;

      const handleKeyDown = (e: KeyboardEvent) => {
          if (!showMentions) return;

          if (e.key === 'ArrowDown') {
              e.preventDefault();
              setSelectedIndex(prev => (prev + 1) % filteredMembers.length);
          } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setSelectedIndex(prev => (prev - 1 + filteredMembers.length) % filteredMembers.length);
          } else if (e.key === 'Enter') {
              e.preventDefault();
              if (filteredMembers.length > 0) {
                  handleSelectMember(filteredMembers[selectedIndex]);
              }
          } else if (e.key === 'Escape') {
              setShowMentions(false);
          }
      };

      // Quill root element is where key events happen
      editor.root.addEventListener('keydown', handleKeyDown);
      return () => {
          editor.root.removeEventListener('keydown', handleKeyDown);
      };
  }, [showMentions, filteredMembers, selectedIndex, mentionIndex, mentionQuery]);

  return (
    <div className="relative">
      <RichTextEditor
        ref={quillRef}
        onChange={handleChange}
        skipSanitization={true}
        {...props}
      />
      {showMentions && filteredMembers.length > 0 && (
        <div
            className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto w-64"
            style={{ top: popupPosition.top, left: popupPosition.left }}
        >
            {filteredMembers.map((member, index) => (
                <div
                    key={member.userId}
                    className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 ${index === selectedIndex ? 'bg-blue-50' : ''}`}
                    onClick={() => handleSelectMember(member)}
                >
                    <Avatar userName={member.userName} avatarUrl={member.avatarUrl} size="sm" className="mr-2" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{member.userName}</span>
                        <span className="text-xs text-gray-500">{member.userEmail}</span>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
};
