import { usePresenceTransition } from '@/hooks/usePresenceTransition';
import type { IconType } from 'react-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HiCheck, HiChevronDown } from 'react-icons/hi';
import { RiEnglishInput } from 'react-icons/ri';
import { TbAlphabetKorean } from 'react-icons/tb';

interface LanguageOption {
    code: string;
    nativeLabel: string;
    icon: IconType;
}

const LANGUAGE_OPTIONS: LanguageOption[] = [
    { code: 'en', nativeLabel: 'English', icon: RiEnglishInput },
    { code: 'ko', nativeLabel: '한국어', icon: TbAlphabetKorean },
];

export const LanguageSwitcher: React.FC = () => {
    const { i18n, t } = useTranslation('common');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const transition = usePresenceTransition(isOpen, 180);

    const currentLanguage = i18n.language || 'en';

    const selectedLanguage = useMemo(
        () => LANGUAGE_OPTIONS.find((option) => currentLanguage.startsWith(option.code)) ?? LANGUAGE_OPTIONS[0],
        [currentLanguage],
    );

    const handleSelect = (code: string) => {
        if (code !== selectedLanguage.code) {
            i18n.changeLanguage(code);
        }
        setIsOpen(false);
    };

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen((prev) => !prev)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-200 hover:border-white/30 transition-colors min-w-[60px]"
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label={`${t('language.label')}: ${selectedLanguage.nativeLabel}`}
            >
                <selectedLanguage.icon className="text-xl" />
                <HiChevronDown className={`text-base transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                <span className="sr-only">{selectedLanguage.nativeLabel}</span>
            </button>

            {transition.shouldRender && (
                <div
                    className={`dropdown-panel dropdown-panel-${transition.stage} absolute right-0 top-full w-44 bg-slate-800 rounded-lg shadow-xl border border-white/10 text-slate-200 z-[330]`}
                    role="listbox"
                    aria-label={t('language.label')}
                >
                    {LANGUAGE_OPTIONS.map((option) => (
                        <button
                            key={option.code}
                            onClick={() => handleSelect(option.code)}
                            className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors flex items-center justify-between gap-2"
                            role="option"
                            aria-selected={selectedLanguage.code === option.code}
                        >
                            <span className="flex items-center gap-2">
                                <option.icon className="text-lg" />
                                <span className="text-sm font-semibold text-white">{option.nativeLabel}</span>
                            </span>
                            {selectedLanguage.code === option.code && <HiCheck className="text-blue-400" />}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
