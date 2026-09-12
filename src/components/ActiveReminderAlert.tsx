import React, { useState } from 'react';
import { Bell, CheckCircle, Clock, X, Volume2, Play, Square } from 'lucide-react';
import { Reminder, Language } from '../types';
import { translations, categoryMeta, getCategoryLabel } from '../i18n/translations';
import { AVAILABLE_TONES, playTone } from '../services/toneService';
import { storage } from '../services/storage';

interface ActiveReminderAlertProps {
  reminder: Reminder | null;
  language: Language;
  onDone: (reminder: Reminder) => void;
  onSnooze: (reminder: Reminder, minutes?: number) => void;
  onDismiss: () => void;
}

export const ActiveReminderAlert: React.FC<ActiveReminderAlertProps> = ({
  reminder,
  language,
  onDone,
  onSnooze,
  onDismiss,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  if (!reminder) return null;

  const t = translations[language];
  const cat = categoryMeta[reminder.category] || categoryMeta.Other;
  const toneId = reminder.tone || storage.getDefaultTone();
  const toneInfo = AVAILABLE_TONES.find((item) => item.id === toneId) || AVAILABLE_TONES[0];

  const handleReplay = () => {
    setIsPlayingAudio(true);
    const volume = storage.getVolume();
    playTone(toneId, volume);
    setTimeout(() => setIsPlayingAudio(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="active-reminder-modal"
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-blue-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
      >
        {/* Header bar */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center animate-bounce">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-wider font-bold text-blue-100">
                {t.appTitle}
              </span>
              <h4 className="text-sm font-semibold">
                {t.today}
              </h4>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{cat.icon}</span>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">
                {getCategoryLabel(reminder.category, language)} • {reminder.time}
              </span>
              <h3 className="text-xl font-bold text-slate-900 leading-snug">
                {reminder.title}
              </h3>
            </div>
          </div>

          {/* Tone indicator bar */}
          <div className="flex items-center justify-between px-3 py-2 bg-blue-50/70 border border-blue-100 rounded-xl text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base">{toneInfo.icon}</span>
              <div className="truncate">
                <span className="font-semibold text-blue-900">{toneInfo.name}</span>
                <span className="text-slate-500 text-[11px] block">{toneInfo.tag} tone alert</span>
              </div>
            </div>
            <button
              id="btn-alert-replay-tone"
              type="button"
              onClick={handleReplay}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                isPlayingAudio
                  ? 'bg-amber-400 text-amber-950 animate-pulse'
                  : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isPlayingAudio ? 'Playing...' : 'Replay'}</span>
            </button>
          </div>

          {reminder.notes && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-600">
              {reminder.notes}
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              id="btn-alert-done"
              onClick={() => onDone(reminder)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 active:scale-98 shadow-sm transition-all text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{t.markDone}</span>
            </button>
            <button
              id="btn-alert-snooze"
              onClick={() => onSnooze(reminder, 15)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-100 text-slate-800 font-bold hover:bg-slate-200 active:scale-98 transition-all text-sm border border-slate-200"
            >
              <Clock className="w-4 h-4 text-slate-600" />
              <span>{t.snooze15m}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

