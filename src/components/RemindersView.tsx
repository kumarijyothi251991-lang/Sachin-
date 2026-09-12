import React, { useState, useMemo } from 'react';
import {
  Clock,
  Plus,
  Sparkles,
  CheckCircle2,
  Circle,
  MoreVertical,
  Calendar,
  Repeat,
  Pill,
  BookOpen,
  FastForward,
  Trash2,
  Edit3,
  Power,
  ShieldAlert,
  ChevronDown,
  Sun,
  Volume2,
} from 'lucide-react';
import { Reminder, ReminderCategory, Language } from '../types';
import { translations, categoryMeta, getCategoryLabel, getRepeatLabel } from '../i18n/translations';
import { getTodayDateString, storage } from '../services/storage';
import { AVAILABLE_TONES } from '../services/toneService';
import { playReminderTone } from '../services/notificationService';

interface RemindersViewProps {
  reminders: Reminder[];
  language: Language;
  onOpenCreateModal: (category?: ReminderCategory) => void;
  onOpenNaturalAiModal: () => void;
  onToggleComplete: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onSkipRecurring: (id: string) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
}

type SubTab = 'today' | 'upcoming' | 'myday' | 'medicine' | 'study';

export const RemindersView: React.FC<RemindersViewProps> = ({
  reminders,
  language,
  onOpenCreateModal,
  onOpenNaturalAiModal,
  onToggleComplete,
  onToggleEnabled,
  onSnooze,
  onSkipRecurring,
  onEdit,
  onDelete,
}) => {
  const t = translations[language];
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('today');
  const [selectedCategory, setSelectedCategory] = useState<ReminderCategory | 'all'>('all');
  const [snoozeMenuOpenId, setSnoozeMenuOpenId] = useState<string | null>(null);

  const todayStr = getTodayDateString();
  const dayOfWeek = new Date().getDay();
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

  // Filter reminders relevant for today
  const isTodayReminder = (r: Reminder) => {
    if (r.repeat === 'daily') return true;
    if (r.repeat === 'weekdays' && isWeekday) return true;
    if (r.repeat === 'weekly') {
      const remDate = new Date(r.date);
      return remDate.getDay() === dayOfWeek;
    }
    return r.date === todayStr;
  };

  // Groupings
  const todayReminders = useMemo(() => {
    return reminders
      .filter((r) => isTodayReminder(r))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [reminders, todayStr, isWeekday, dayOfWeek]);

  const todayPending = todayReminders.filter((r) => !r.completed);
  const todayCompleted = todayReminders.filter((r) => r.completed);

  const upcomingReminders = useMemo(() => {
    return reminders
      .filter((r) => r.date > todayStr || r.repeat !== 'once')
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [reminders, todayStr]);

  // My Day chronological plan
  const myDayPlan = useMemo(() => {
    return todayReminders.filter((r) => r.enabled);
  }, [todayReminders]);

  // Medicine view
  const medicineReminders = useMemo(() => {
    return reminders.filter((r) => r.category === 'Medicine');
  }, [reminders]);

  // Study view
  const studyReminders = useMemo(() => {
    return reminders.filter((r) => r.category === 'Study');
  }, [reminders]);

  // Apply category filter if active in today or upcoming
  const applyCategoryFilter = (list: Reminder[]) => {
    if (selectedCategory === 'all') return list;
    return list.filter((r) => r.category === selectedCategory);
  };

  const formatTime = (time24: string) => {
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
    <div className="space-y-4 pb-20 max-w-md mx-auto">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">
            {t.myRemindersBtn}
          </h2>
          <p className="text-xs text-slate-500">
            {t.reminderSubGen}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-nl-reminder"
            onClick={onOpenNaturalAiModal}
            className="flex items-center gap-1 py-2 px-3 rounded-xl bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 active:scale-95 transition-all border border-blue-200 shadow-2xs"
            title={t.naturalModalTitle}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI</span>
          </button>
          <button
            id="btn-add-reminder-header"
            onClick={() => onOpenCreateModal()}
            className="flex items-center gap-1 py-2 px-3.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-95 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{t.createReminder}</span>
          </button>
        </div>
      </div>

      {/* Sub tabs: Today | My Day | Upcoming | Medicine | Study */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        <button
          id="subtab-today"
          onClick={() => setActiveSubTab('today')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            activeSubTab === 'today'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {t.today} ({todayPending.length})
        </button>

        <button
          id="subtab-myday"
          onClick={() => setActiveSubTab('myday')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1 ${
            activeSubTab === 'myday'
              ? 'bg-amber-500 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>{t.myDay}</span>
        </button>

        <button
          id="subtab-upcoming"
          onClick={() => setActiveSubTab('upcoming')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
            activeSubTab === 'upcoming'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {t.upcoming}
        </button>

        <button
          id="subtab-medicine"
          onClick={() => setActiveSubTab('medicine')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1 ${
            activeSubTab === 'medicine'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
          }`}
        >
          <Pill className="w-3.5 h-3.5" />
          <span>{getCategoryLabel('Medicine', language)}</span>
        </button>

        <button
          id="subtab-study"
          onClick={() => setActiveSubTab('study')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1 ${
            activeSubTab === 'study'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{getCategoryLabel('Study', language)}</span>
        </button>
      </div>

      {/* Category filters (for Today / Upcoming) */}
      {(activeSubTab === 'today' || activeSubTab === 'upcoming') && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {t.viewAll}
          </button>
          {Object.entries(categoryMeta).map(([catKey, meta]) => (
            <button
              key={catKey}
              onClick={() => setSelectedCategory(catKey as ReminderCategory)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1 transition-all ${
                selectedCategory === catKey
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span>{meta.icon}</span>
              <span>{getCategoryLabel(catKey as ReminderCategory, language)}</span>
            </button>
          ))}
        </div>
      )}

      {/* VIEW: TODAY */}
      {activeSubTab === 'today' && (
        <div className="space-y-4">
          {/* PENDING */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              <span>{t.upcoming}</span>
              <span>{applyCategoryFilter(todayPending).length}</span>
            </div>

            {applyCategoryFilter(todayPending).length > 0 ? (
              applyCategoryFilter(todayPending).map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  language={language}
                  onToggleComplete={onToggleComplete}
                  onToggleEnabled={onToggleEnabled}
                  onSnooze={onSnooze}
                  onSkipRecurring={onSkipRecurring}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  snoozeMenuOpenId={snoozeMenuOpenId}
                  setSnoozeMenuOpenId={setSnoozeMenuOpenId}
                />
              ))
            ) : (
              <div className="text-center py-6 px-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                {t.noUpcomingReminders}
              </div>
            )}
          </div>

          {/* COMPLETED */}
          {todayCompleted.length > 0 && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-700 uppercase tracking-wider px-1">
                <span>{t.markCompleted}</span>
                <span>{applyCategoryFilter(todayCompleted).length}</span>
              </div>

              {applyCategoryFilter(todayCompleted).map((reminder) => (
                <ReminderCard
                  key={reminder.id}
                  reminder={reminder}
                  language={language}
                  onToggleComplete={onToggleComplete}
                  onToggleEnabled={onToggleEnabled}
                  onSnooze={onSnooze}
                  onSkipRecurring={onSkipRecurring}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  snoozeMenuOpenId={snoozeMenuOpenId}
                  setSnoozeMenuOpenId={setSnoozeMenuOpenId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: MY DAY */}
      {activeSubTab === 'myday' && (
        <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                <Sun className="w-5 h-5 text-amber-500" />
                <span>{t.myDay} — {new Date().toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}</span>
              </h3>
              <p className="text-xs text-slate-500">
                {t.reminderSubGen}
              </p>
            </div>
          </div>

          {myDayPlan.length > 0 ? (
            <div className="relative pl-6 space-y-4 pt-2 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {myDayPlan.map((r) => {
                const cat = categoryMeta[r.category] || categoryMeta.Other;
                return (
                  <div key={r.id} className="relative group">
                    <div
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${
                        r.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-white border-blue-500 text-blue-600'
                      }`}
                    >
                      {r.completed ? '✓' : ''}
                    </div>

                    <div className="bg-slate-50 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-200 transition-colors flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                            {formatTime(r.time)}
                          </span>
                          <span className="text-xs">{cat.icon}</span>
                          <span className={`text-sm font-bold ${r.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {r.title}
                          </span>
                        </div>
                        {r.notes && <p className="text-xs text-slate-500 mt-1 pl-1">{r.notes}</p>}
                      </div>

                      <button
                        onClick={() => onToggleComplete(r.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-colors shrink-0 ${
                          r.completed
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {r.completed ? '✓' : t.markCompleted}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-500">
              {t.noUpcomingReminders}
            </div>
          )}
        </div>
      )}

      {/* VIEW: UPCOMING */}
      {activeSubTab === 'upcoming' && (
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            {t.upcoming}
          </div>

          {applyCategoryFilter(upcomingReminders).length > 0 ? (
            applyCategoryFilter(upcomingReminders).map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                language={language}
                onToggleComplete={onToggleComplete}
                onToggleEnabled={onToggleEnabled}
                onSnooze={onSnooze}
                onSkipRecurring={onSkipRecurring}
                onEdit={onEdit}
                onDelete={onDelete}
                snoozeMenuOpenId={snoozeMenuOpenId}
                setSnoozeMenuOpenId={setSnoozeMenuOpenId}
              />
            ))
          ) : (
            <div className="text-center py-8 px-4 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              {t.noUpcomingReminders}
            </div>
          )}
        </div>
      )}

      {/* VIEW: MEDICINE */}
      {activeSubTab === 'medicine' && (
        <div className="space-y-4">
          {/* Medical safety notice */}
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-xs text-rose-900">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold uppercase tracking-wide">
                {t.disclaimerTitle}
              </span>
              <p className="text-[11px] text-rose-800 leading-relaxed">
                {t.disclaimerMedicine}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">
              {getCategoryLabel('Medicine', language)} ({medicineReminders.length})
            </span>
            <button
              id="btn-add-medicine-shortcut"
              onClick={() => onOpenCreateModal('Medicine')}
              className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addMedicineSchedule}</span>
            </button>
          </div>

          {medicineReminders.length > 0 ? (
            medicineReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                language={language}
                onToggleComplete={onToggleComplete}
                onToggleEnabled={onToggleEnabled}
                onSnooze={onSnooze}
                onSkipRecurring={onSkipRecurring}
                onEdit={onEdit}
                onDelete={onDelete}
                snoozeMenuOpenId={snoozeMenuOpenId}
                setSnoozeMenuOpenId={setSnoozeMenuOpenId}
              />
            ))
          ) : (
            <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              {t.noUpcomingReminders}
            </div>
          )}
        </div>
      )}

      {/* VIEW: STUDY */}
      {activeSubTab === 'study' && (
        <div className="space-y-4">
          <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl text-xs text-indigo-900 flex items-start gap-2.5">
            <BookOpen className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">
                {getCategoryLabel('Study', language)}
              </span>
              <p className="text-[11px] text-indigo-800 mt-0.5">
                {t.reminderSubGen}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-700">
              {getCategoryLabel('Study', language)} ({studyReminders.length})
            </span>
            <button
              id="btn-add-study-shortcut"
              onClick={() => onOpenCreateModal('Study')}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.addStudySchedule}</span>
            </button>
          </div>

          {studyReminders.length > 0 ? (
            studyReminders.map((reminder) => (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                language={language}
                onToggleComplete={onToggleComplete}
                onToggleEnabled={onToggleEnabled}
                onSnooze={onSnooze}
                onSkipRecurring={onSkipRecurring}
                onEdit={onEdit}
                onDelete={onDelete}
                snoozeMenuOpenId={snoozeMenuOpenId}
                setSnoozeMenuOpenId={setSnoozeMenuOpenId}
              />
            ))
          ) : (
            <div className="text-center py-8 bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              {t.noUpcomingReminders}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// -------------------------------------------------------------
// Sub-component: Reminder Card with Snooze, Complete, Skip actions
// -------------------------------------------------------------
interface ReminderCardProps {
  reminder: Reminder;
  language: Language;
  onToggleComplete: (id: string) => void;
  onToggleEnabled: (id: string) => void;
  onSnooze: (id: string, minutes: number) => void;
  onSkipRecurring: (id: string) => void;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  snoozeMenuOpenId: string | null;
  setSnoozeMenuOpenId: (id: string | null) => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  language,
  onToggleComplete,
  onToggleEnabled,
  onSnooze,
  onSkipRecurring,
  onEdit,
  onDelete,
  snoozeMenuOpenId,
  setSnoozeMenuOpenId,
}) => {
  const t = translations[language];
  const cat = categoryMeta[reminder.category] || categoryMeta.Other;
  const isSnoozeOpen = snoozeMenuOpenId === reminder.id;

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
    <div
      id={`reminder-card-${reminder.id}`}
      className={`bg-white rounded-2xl border transition-all p-3.5 space-y-2.5 ${
        !reminder.enabled
          ? 'opacity-60 border-slate-200 bg-slate-50/50'
          : reminder.completed
          ? 'border-emerald-200 bg-emerald-50/30'
          : 'border-slate-200 shadow-xs hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Toggle check */}
        <button
          onClick={() => onToggleComplete(reminder.id)}
          className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0 active:scale-95"
          title="Toggle completion"
        >
          {reminder.completed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
          ) : (
            <Circle className="w-5 h-5 text-slate-300 hover:text-slate-500" />
          )}
        </button>

        {/* Title and metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-base shrink-0">{cat.icon}</span>
            <h4
              className={`text-sm font-bold truncate leading-tight ${
                reminder.completed ? 'line-through text-slate-400' : 'text-slate-900'
              }`}
            >
              {reminder.title}
            </h4>
          </div>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500 flex-wrap">
            {/* Time badge */}
            <span className="font-bold text-slate-800 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md">
              <Clock className="w-3 h-3 text-blue-600" />
              <span>{formatDisplayTime(reminder.time)}</span>
            </span>

            {/* Repeat badge */}
            {reminder.repeat !== 'once' && (
              <span className="flex items-center gap-1 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                <Repeat className="w-2.5 h-2.5" />
                <span>{getRepeatLabel(reminder.repeat, language)}</span>
              </span>
            )}

            {/* Snoozed indicator */}
            {reminder.snoozedUntil && (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md font-semibold">
                {t.snooze}
              </span>
            )}

            {/* Tone badge with instant audio preview */}
            {(() => {
              const toneId = reminder.tone || storage.getDefaultTone();
              const toneInfo = AVAILABLE_TONES.find((item) => item.id === toneId) || AVAILABLE_TONES[0];
              return (
                <button
                  id={`btn-play-tone-card-${reminder.id}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    playReminderTone(reminder);
                  }}
                  className="flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 border border-blue-100 px-1.5 py-0.5 rounded-md transition-all active:scale-95 font-medium"
                  title={`Play "${toneInfo.name}" reminder tone`}
                >
                  <Volume2 className="w-2.5 h-2.5 text-blue-600" />
                  <span>{toneInfo.icon} {toneInfo.name}</span>
                </button>
              );
            })()}
          </div>

          {reminder.notes && (
            <p className="text-xs text-slate-500 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
              {reminder.notes}
            </p>
          )}
        </div>

        {/* Enable / Disable power toggle */}
        <button
          onClick={() => onToggleEnabled(reminder.id)}
          className={`p-1.5 rounded-lg text-xs transition-colors shrink-0 ${
            reminder.enabled
              ? 'text-emerald-600 hover:bg-emerald-50'
              : 'text-slate-400 hover:bg-slate-100'
          }`}
          title={reminder.enabled ? 'Disable' : 'Enable'}
        >
          <Power className="w-4 h-4" />
        </button>
      </div>

      {/* Card Action Row: Snooze, Skip, Edit, Delete */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 relative">
          {/* Snooze dropdown */}
          <button
            onClick={() => setSnoozeMenuOpenId(isSnoozeOpen ? null : reminder.id)}
            className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-semibold px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{t.snooze}</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {isSnoozeOpen && (
            <div className="absolute left-0 top-8 z-20 bg-white rounded-xl shadow-lg border border-slate-200 p-1 w-36 flex flex-col space-y-0.5 animate-in fade-in">
              <button
                onClick={() => {
                  onSnooze(reminder.id, 15);
                  setSnoozeMenuOpenId(null);
                }}
                className="text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 text-slate-700"
              >
                +15 {t.time}
              </button>
              <button
                onClick={() => {
                  onSnooze(reminder.id, 60);
                  setSnoozeMenuOpenId(null);
                }}
                className="text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 text-slate-700"
              >
                +1 {t.time}
              </button>
              <button
                onClick={() => {
                  onSnooze(reminder.id, 1440);
                  setSnoozeMenuOpenId(null);
                }}
                className="text-left px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-50 text-slate-700"
              >
                {t.upcoming}
              </button>
            </div>
          )}

          {/* Skip recurrence button */}
          {reminder.repeat !== 'once' && (
            <button
              onClick={() => onSkipRecurring(reminder.id)}
              className="flex items-center gap-1 text-slate-600 hover:text-amber-600 font-semibold px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              title="Skip this recurrence"
            >
              <FastForward className="w-3 h-3 text-amber-500" />
              <span>{t.skip}</span>
            </button>
          )}
        </div>

        {/* Edit & Delete */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(reminder)}
            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
            title={t.edit}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(reminder.id)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title={t.delete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
