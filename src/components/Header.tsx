import React, { useState, useRef, useEffect } from 'react';
import { Bell, BellOff, Globe, Sparkles, Check, ChevronDown } from 'lucide-react';
import { Language, SUPPORTED_LANGUAGES } from '../types';
import { translations } from '../i18n/translations';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  notificationPermission: NotificationPermission;
  onRequestNotification: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  notificationPermission,
  onRequestNotification,
}) => {
  const t = translations[language];
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const currentLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    if (isLangMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLangMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 shadow-xs">
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">
              {t.appTitle}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium truncate max-w-[190px]">
              {t.appTagline}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
          {/* Language Switcher Dropdown */}
          <div className="relative" ref={langMenuRef}>
            <button
              id="btn-lang-toggle"
              onClick={() => setIsLangMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors active:scale-95 text-slate-700 bg-white"
              title={t.languageSelection}
            >
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>{currentLangObj.flag}</span>
              <span className="font-bold">{currentLangObj.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isLangMenuOpen && (
              <div
                id="dropdown-lang-menu"
                className="absolute right-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-1">
                  {t.language}
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = lang.code === language;
                  return (
                    <button
                      key={lang.code}
                      id={`lang-opt-${lang.code}`}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-blue-50 text-blue-700 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span>{lang.flag}</span>
                        <span className="truncate">{lang.nativeName}</span>
                        <span className="text-[10px] text-slate-400">({lang.name})</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Notification Button */}
          <button
            id="btn-notif-toggle"
            onClick={onRequestNotification}
            className={`p-2 rounded-lg border transition-colors relative ${
              notificationPermission === 'granted'
                ? 'border-emerald-200 text-emerald-600 bg-emerald-50/60 hover:bg-emerald-100/60'
                : 'border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
            title={notificationPermission === 'granted' ? t.notificationsEnabled : t.enableNotifications}
          >
            {notificationPermission === 'granted' ? (
              <>
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </>
            ) : (
              <BellOff className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
