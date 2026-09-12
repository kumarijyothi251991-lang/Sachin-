import React, { useState, useEffect } from 'react';
import {
  BellRing,
  Volume2,
  CheckCircle2,
  Clock,
  X,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { Reminder, Language } from '../types';
import { translations, categoryMeta, getCategoryLabel } from '../i18n/translations';
import { AVAILABLE_TONES, playTone } from '../services/toneService';
import { storage } from '../services/storage';

interface InWebsiteReminderBannerProps {
  reminder: Reminder | null;
  language: Language;
  onDone: (reminder: Reminder) => void;
  onSnooze: (reminder: Reminder, minutes?: number) => void;
  onDismiss: () => void;
  onExpandToModal?: (reminder: Reminder) => void;
}

export const InWebsiteReminderBanner: React.FC<InWebsiteReminderBannerProps> = ({
  reminder,
  language,
  onDone,
  onSnooze,
  onDismiss,
  onExpandToModal,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    if (reminder) {
      setIsPlayingAudio(true);
      const timer = setTimeout(() => setIsPlayingAudio(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [reminder]);

  if (!reminder) return null;

  const t = translations[language];
  const cat = categoryMeta[reminder.category] || categoryMeta.Other;
  const toneId = reminder.tone || storage.getDefaultTone();
  const toneInfo = AVAILABLE_TONES.find((item) => item.id === toneId) || AVAILABLE_TONES[0];

  const handleReplayTone = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlayingAudio(true);
    const volume = storage.getVolume();
    playTone(toneId, volume);
    setTimeout(() => setIsPlayingAudio(false), 1200);
  };

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
      id="in-website-reminder-banner"
      className="fixed top-3 inset-x-3 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md z-50 pointer-events-auto animate-in slide-in-from-top-4 duration-300"
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border-2 border-blue-500 overflow-hidden ring-4 ring-blue-500/10">
        {/* Top accent bar */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 px-3.5 py-1.5 flex items-center justify-between text-white text-[11px] font-bold">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
            </span>
            <span className="tracking-wider uppercase">Website Reminder Alert</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Tone pill */}
            <button
              id="btn-banner-replay-tone"
              type="button"
              onClick={handleReplayTone}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                isPlayingAudio
                  ? 'bg-amber-400 text-amber-950 ring-1 ring-white animate-pulse'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title="Click to replay notification tone"
            >
              <Volume2 className="w-3 h-3" />
              <span>{toneInfo.icon} {toneInfo.name}</span>
            </button>

            {onExpandToModal && (
              <button
                type="button"
                onClick={() => onExpandToModal(reminder)}
                className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10"
                title="Expand alert"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              id="btn-banner-dismiss"
              type="button"
              onClick={onDismiss}
              className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10"
              title={t.cancel}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content body */}
        <div className="p-3.5 space-y-2.5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 text-xl shadow-xs relative">
              {cat.icon}
              {isPlayingAudio && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] animate-bounce">
                  🔔
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                  {getCategoryLabel(reminder.category, language)}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded-md">
                  {formatDisplayTime(reminder.time)}
                </span>
              </div>
              <h4 className="text-base font-bold text-slate-900 leading-tight truncate mt-0.5">
                {reminder.title}
              </h4>
              {reminder.notes && (
                <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                  {reminder.notes}
                </p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
            <button
              id="btn-banner-done"
              type="button"
              onClick={() => onDone(reminder)}
              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t.markDone}</span>
            </button>

            <button
              id="btn-banner-snooze"
              type="button"
              onClick={() => onSnooze(reminder, 15)}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-slate-200"
            >
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.snooze15m}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
