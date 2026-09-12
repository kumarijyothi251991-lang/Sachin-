import React from 'react';
import { Home, Package, Clock, Bot, MessageSquare, Settings } from 'lucide-react';
import { NavTab, Language } from '../types';
import { translations } from '../i18n/translations';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  language: Language;
  pendingRemindersCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  language,
  pendingRemindersCount,
}) => {
  const t = translations[language];

  const tabs = [
    { id: 'home' as NavTab, label: t.navHome, icon: Home },
    { id: 'items' as NavTab, label: t.navMemory, icon: Package },
    { id: 'reminders' as NavTab, label: t.navReminders, icon: Clock, badge: pendingRemindersCount },
    { id: 'ai' as NavTab, label: t.navAi, icon: Bot },
    { id: 'settings' as NavTab, label: t.navSettings, icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 pb-safe shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-5 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center relative transition-all active:scale-95 ${
                isActive ? 'text-blue-600 font-semibold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center shadow-xs">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-1 truncate max-w-[56px] ${isActive ? 'text-blue-600 font-semibold' : 'text-slate-500'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
