import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { modalOverlayClass, modalPanelClass } from '@/styles/modalStyles';
import { useState } from 'react';

export const KeyboardShortcutsHelp = () => {
    const [isOpen, setIsOpen] = useState(false);

    // Shift + / (?) key to toggle
    useKeyboardShortcut('shift+slash', () => {
        setIsOpen(prev => !prev);
    }, { preventDefault: true });

    return (
        <>
            {isOpen && <KeyboardShortcutsModal onClose={() => setIsOpen(false)} />}
        </>
    );
};

const KeyboardShortcutsModal = ({ onClose }: { onClose: () => void }) => {
    const { stage, close } = useModalAnimation(onClose);

    const shortcuts = [
        {
            category: 'Global',
            items: [
                { keys: ['Cmd', 'K'], description: 'Command Palette 열기' },
                { keys: ['Shift', 'T'], description: '오늘의 팁 보기' },
                { keys: ['Shift', '/'], description: '단축키 도움말 (이 모달)' },
            ]
        },
        {
            category: 'Board View',
            items: [
                { keys: ['C'], description: '새 카드 생성' },
                { keys: ['/'], description: '검색 패널 열기' },
            ]
        },
        {
            category: 'Card Modals',
            items: [
                { keys: ['Esc'], description: '모달 닫기' },
                { keys: ['Cmd', '↵'], description: '저장/생성' },
                { keys: ['Cmd', 'I'], description: '나에게 할당' },
            ]
        }
    ];

    return (
        <div className={modalOverlayClass(stage, 'z-[9999]')} onClick={close}>
            <div
                className={modalPanelClass({ stage, maxWidth: 'max-w-2xl', padding: 'p-0' })}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/20">
                    <h2 className="text-2xl font-bold text-pastel-blue-900">키보드 단축키</h2>
                    <p className="text-sm text-pastel-blue-600 mt-1">
                        빠른 작업을 위한 단축키 목록입니다
                    </p>
                </div>

                {/* Content */}
                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                    {shortcuts.map((section, idx) => (
                        <div key={section.category} className={idx > 0 ? 'mt-6' : ''}>
                            <h3 className="text-sm font-semibold text-pastel-blue-700 uppercase tracking-wide mb-3">
                                {section.category}
                            </h3>
                            <div className="space-y-2">
                                {section.items.map((item) => {
                                    const itemKey = `${section.category}-${item.description}-${item.keys.join('+')}`;
                                    return (
                                        <div
                                            key={itemKey}
                                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-white/30 hover:bg-white/50 transition-colors"
                                        >
                                            <span className="text-sm text-pastel-blue-900">{item.description}</span>
                                            <div className="flex items-center gap-1">
                                                {item.keys.map((key, keyIdx) => {
                                                    const shortcutKey = `${itemKey}-${key}-${keyIdx}`;
                                                    return (
                                                        <span key={shortcutKey} className="flex items-center gap-1">
                                                            <kbd className="px-2 py-1 text-xs font-semibold text-pastel-blue-700 bg-white border border-pastel-blue-200 rounded shadow-sm">
                                                                {key}
                                                            </kbd>
                                                            {keyIdx < item.keys.length - 1 && (
                                                                <span className="text-pastel-blue-400">+</span>
                                                            )}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/20 bg-white/20">
                    <div className="flex items-center justify-between text-sm text-pastel-blue-600">
                        <span>💡 Tip: 입력 필드에서는 일부 단축키가 비활성화됩니다</span>
                        <button
                            onClick={close}
                            className="px-4 py-2 rounded-lg bg-pastel-blue-500 text-white hover:bg-pastel-blue-600 transition-colors font-semibold"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
