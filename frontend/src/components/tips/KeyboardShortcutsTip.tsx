import React from 'react';

const categories = [
  {
    title: 'GLOBAL',
    items: [
      { description: 'Command Palette 열기', keys: ['Cmd', 'K'] },
      { description: '오늘의 팁 보기', keys: ['Shift', 'T'] },
      { description: '단축키 도움말', keys: ['Shift', '/'] },
    ],
  },
  {
    title: 'BOARD VIEW',
    items: [
      { description: '새 카드 생성', keys: ['C'] },
      { description: '검색 패널 열기', keys: ['/'] },
    ],
  },
  {
    title: 'CARD MODALS',
    items: [
      { description: '모달 닫기', keys: ['Esc'] },
      { description: '저장/생성', keys: ['Cmd', 'Enter'] },
      { description: '나에게 할당', keys: ['Cmd', 'I'] },
    ],
  },
];

export const KeyboardShortcutsTip: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col px-6 py-2 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center justify-center mb-6 shrink-0">
        <span className="text-4xl mb-3">⌨️</span>
        <h3 className="text-xl font-bold text-slate-800 mb-1">키보드 단축키</h3>
        <p className="text-sm text-slate-500">빠른 작업을 위한 단축키 목록입니다</p>
      </div>

      <div className="space-y-5 pb-4">
        {categories.map((category) => (
          <div key={category.title}>
            <h4 className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-wider">
              {category.title}
            </h4>
            <div className="space-y-2">
              {category.items.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100"
                >
                  <span className="text-sm text-slate-700 font-medium">
                    {item.description}
                  </span>
                  <div className="flex items-center gap-1">
                    {item.keys.map((key, keyIndex) => (
                      <React.Fragment key={keyIndex}>
                        {keyIndex > 0 && <span className="text-slate-400 text-xs">+</span>}
                        <kbd className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 font-mono text-xs font-bold shadow-sm min-w-[1.5rem] text-center">
                          {key === 'Enter' ? '↵' : key}
                        </kbd>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 shrink-0">
        <p className="text-xs text-slate-500 flex items-center gap-1">
          <span>💡</span> Tip: 입력 필드에서는 일부 단축키가 비활성화됩니다
        </p>
      </div>
    </div>
  );
};
