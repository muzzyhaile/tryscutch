import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../types-languages';
import { Globe, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (language: SupportedLanguage) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  currentLanguage, 
  onLanguageChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-100 transition-all"
      >
        <Globe size={18} className="text-zinc-600" />
        <span className="text-lg">{currentLang?.flag}</span>
        <span className="text-sm font-medium text-zinc-700 hidden md:block">{currentLang?.nativeName}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-zinc-200 shadow-xl z-50 py-2">
            <div className="px-4 py-2 border-b border-zinc-100">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Select Language</p>
            </div>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onLanguageChange(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-50 transition-all ${
                  currentLanguage === lang.code ? 'bg-zinc-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{lang.flag}</span>
                  <div className="text-left">
                    <div className="font-medium text-zinc-900">{lang.nativeName}</div>
                    <div className="text-xs text-zinc-500">{lang.name}</div>
                  </div>
                </div>
                {currentLanguage === lang.code && (
                  <Check size={16} className="text-zinc-950" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
