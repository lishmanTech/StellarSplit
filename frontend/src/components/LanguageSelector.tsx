import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
    { code: 'fr', label: 'Français', flag: '🇫🇷' },
    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
    { code: 'zh', label: '中文', flag: '🇨🇳' },
    { code: 'ja', label: '日本語', flag: '🇯🇵' },
    { code: 'pt', label: 'Português', flag: '🇧🇷' },
];

export const LanguageSelector: React.FC = () => {
    const { i18n, t } = useTranslation();
    const [isOpen, setIsOpen] = React.useState(false);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        setIsOpen(false);
    };

    const currentLang = languages.find((l) => l.code === i18n.language.split('-')[0])?.label || t('common.loading');

    return (
        <div className="relative group">
            <button 
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                aria-label={`Select language, current: ${currentLang}`}
                aria-haspopup="true"
                aria-expanded={isOpen}
                onClick={() => setIsOpen(!isOpen)}
                onBlur={() => setTimeout(() => setIsOpen(false), 200)}
            >
                <Globe size={18} className="text-[var(--color-primary)]" aria-hidden="true" />
                <span className="hidden sm:inline">
                    {currentLang}
                </span>
            </button>

            <div 
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden"
                role="menu"
                aria-label="Language selection"
            >
                <div className="py-2" role="none">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => changeLanguage(lang.code)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-purple-50 dark:hover:bg-gray-700 ${i18n.language.split('-')[0] === lang.code ? 'text-[var(--color-primary)] font-bold bg-purple-50/50 dark:bg-gray-700' : 'text-gray-600 dark:text-gray-300'
                                }`}
                            role="menuitem"
                        >
                            <span className="text-lg" aria-hidden="true">{lang.flag}</span>
                            {lang.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
