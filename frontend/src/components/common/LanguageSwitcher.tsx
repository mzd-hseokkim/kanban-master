import { useTranslation } from 'react-i18next';
import { RiEnglishInput } from 'react-icons/ri';
import { TbAlphabetKorean } from 'react-icons/tb';

export const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    const currentLanguage = i18n.language;

    const handleToggle = () => {
        const nextLang = currentLanguage.startsWith('ko') ? 'en' : 'ko';
        i18n.changeLanguage(nextLang);
    };

    const isKorean = currentLanguage.startsWith('ko');

    return (
        <button
            onClick={handleToggle}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-200 hover:border-white/30 transition-colors"
            aria-label={isKorean ? 'Switch to English' : '한국어로 전환'}
            title={isKorean ? 'Switch to English' : '한국어로 전환'}
        >
            {isKorean ? <RiEnglishInput className="text-lg" /> : <TbAlphabetKorean className="text-lg" />}
        </button>
    );
};
