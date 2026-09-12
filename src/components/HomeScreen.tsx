import React from 'react';
import {
  Package,
  Search,
  Clock,
  Bot,
  Mic,
  Sparkles,
  MapPin,
  CheckCircle2,
  Circle,
  ChevronRight,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { ItemMemory, Reminder, Language, NavTab } from '../types';
import { translations, categoryMeta, getCategoryLabel } from '../i18n/translations';
import { getTodayDateString } from '../services/storage';

interface HomeScreenProps {
  items: ItemMemory[];
  reminders: Reminder[];
  language: Language;
  onNavigate: (tab: NavTab) => void;
  onOpenRememberModal: () => void;
  onOpenFindView: () => void;
  onOpenNaturalAiModal: () => void;
  onToggleReminderComplete: (id: string) => void;
  onSelectItemToView?: (item: ItemMemory) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  items,
  reminders,
  language,
  onNavigate,
  onOpenRememberModal,
  onOpenFindView,
  onOpenNaturalAiModal,
  onToggleReminderComplete,
  onSelectItemToView,
}) => {
  const t = translations[language];
  const todayStr = getTodayDateString();
  const dayOfWeek = new Date().getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  // Filter Today's Upcoming Reminders
  const todayReminders = reminders
    .filter((r) => {
      if (!r.enabled) return false;
      if (r.repeat === 'daily') return true;
      if (r.repeat === 'weekdays' && isWeekday) return true;
      if (r.repeat === 'weekly') {
        const remDate = new Date(r.date);
        return remDate.getDay() === dayOfWeek;
      }
      return r.date === todayStr;
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  // Today pending reminders (first 4)
  const todayUpcoming = todayReminders.filter((r) => !r.completed).slice(0, 4);

  // Recently remembered items (first 3)
  const recentItems = [...items]
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
    .slice(0, 3);

  const formatDisplayTime = (time24: string) => {
    try {
      const [hStr, mStr] = time24.split(':');
      let h = parseInt(hStr, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12 || 12;
      return `${h}:${mStr} ${ampm}`;
    } catch {
      return time24;
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto">
      {/* 1. Welcoming Hero Section */}
      <div className="text-center pt-2 pb-1 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-100 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>{t.appTitle}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 font-serif">
          {t.appTitle}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 font-medium italic">
          “{t.appTagline}”
        </p>
      </div>

      {/* 2. Prominent Quick Natural Language Voice Bar */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-2xl text-white shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-blue-100 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.naturalModalTitle}</span>
          </span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">
            {t.confirm}
          </span>
        </div>

        <button
          id="btn-quick-voice-bar"
          onClick={onOpenNaturalAiModal}
          className="w-full bg-white text-slate-700 p-2.5 rounded-xl flex items-center justify-between gap-2 shadow-xs hover:bg-slate-50 active:scale-98 transition-all text-left"
        >
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Mic className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-slate-500 truncate">
              {t.naturalReminderHint}
            </span>
          </div>
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* 3. Four Large Tactical Buttons */}
      <div className="grid grid-cols-2 gap-3">
        {/* Button 1: Remember An Item */}
        <button
          id="btn-home-remember-item"
          onClick={onOpenRememberModal}
          className="bg-white hover:bg-blue-50/50 active:scale-98 border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xs transition-all group min-h-[115px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100 group-hover:bg-blue-600 group-hover:text-white text-blue-600 flex items-center justify-center text-2xl transition-colors shadow-2xs mb-2">
            📦
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
            {t.rememberItemBtn}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {t.location}
          </span>
        </button>

        {/* Button 2: Find My Item */}
        <button
          id="btn-home-find-item"
          onClick={onOpenFindView}
          className="bg-white hover:bg-emerald-50/50 active:scale-98 border-2 border-slate-200 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xs transition-all group min-h-[115px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white text-emerald-700 flex items-center justify-center text-2xl transition-colors shadow-2xs mb-2">
            🔍
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
            {t.findItemBtn}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {t.allMemories}
          </span>
        </button>

        {/* Button 3: My Reminders */}
        <button
          id="btn-home-my-reminders"
          onClick={() => onNavigate('reminders')}
          className="bg-white hover:bg-amber-50/50 active:scale-98 border-2 border-slate-200 hover:border-amber-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xs transition-all group min-h-[115px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 group-hover:bg-amber-500 group-hover:text-white text-amber-700 flex items-center justify-center text-2xl transition-colors shadow-2xs mb-2">
            ⏰
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
            {t.myRemindersBtn}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {t.today}
          </span>
        </button>

        {/* Button 4: Ask RemindMe AI */}
        <button
          id="btn-home-ask-ai"
          onClick={() => onNavigate('ai')}
          className="bg-white hover:bg-indigo-50/50 active:scale-98 border-2 border-slate-200 hover:border-indigo-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-xs transition-all group min-h-[115px]"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 group-hover:bg-indigo-600 group-hover:text-white text-indigo-700 flex items-center justify-center text-2xl transition-colors shadow-2xs mb-2">
            🤖
          </div>
          <span className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
            {t.askAiBtn}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5">
            {t.navAi}
          </span>
        </button>
      </div>

      {/* 4. TODAY SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>{t.today}</span>
            </span>
            <span className="text-[11px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded-full">
              {todayUpcoming.length}
            </span>
          </div>

          <button
            onClick={() => onNavigate('reminders')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            <span>{t.viewAll}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {todayUpcoming.length > 0 ? (
          <div className="space-y-2">
            {todayUpcoming.map((reminder) => {
              const cat = categoryMeta[reminder.category] || categoryMeta.Other;
              return (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/70"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      onClick={() => onToggleReminderComplete(reminder.id)}
                      className="text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                    >
                      <Circle className="w-4 h-4 text-slate-400" />
                    </button>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                        <span>{cat.icon}</span>
                        <span className="truncate">{reminder.title}</span>
                      </div>
                      <span className="text-[11px] text-blue-700 font-semibold block">
                        {formatDisplayTime(reminder.time)}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 rounded-md bg-white border border-slate-200 shrink-0">
                    {getCategoryLabel(reminder.category, language)}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-500">
            {t.noUpcomingReminders}
          </div>
        )}
      </div>

      {/* 5. RECENTLY REMEMBERED SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-600" />
              <span>{t.recentlyRemembered}</span>
            </span>
          </div>

          <button
            onClick={() => onNavigate('items')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            <span>{t.viewAll}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentItems.length > 0 ? (
          <div className="space-y-2.5">
            {recentItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectItemToView?.(item)}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200/70 cursor-pointer"
              >
                {item.photo ? (
                  <img
                    src={item.photo}
                    alt={item.itemName}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                    📦
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {item.itemName}
                  </h4>
                  <div className="flex items-center gap-1 text-xs font-semibold text-blue-700 mt-0.5 truncate">
                    <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-500">
            {t.noRecentItems}
          </div>
        )}
      </div>
    </div>
  );
};
