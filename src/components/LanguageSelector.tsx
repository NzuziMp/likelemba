import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export const LanguageSelector = () => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'ar', name: 'العربية' },
    { code: 'pt', name: 'Português' },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{currentLanguage?.name}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as 'en' | 'fr' | 'ar' | 'pt');
                setIsOpen(false);
              }}
              className={`w-full flex items-center px-4 py-2 text-left hover:bg-slate-50 transition-colors ${
                language === lang.code ? 'bg-primary-50 text-primary-700' : 'text-slate-700'
              }`}
            >
              <span className="font-medium">{lang.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
