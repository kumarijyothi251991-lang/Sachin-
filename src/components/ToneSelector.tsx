import React, { useState } from 'react';
import { Volume2, Play, Square, Check, Music } from 'lucide-react';
import { ReminderToneId, ToneInfo } from '../types';
import { AVAILABLE_TONES, playTone } from '../services/toneService';
import { storage } from '../services/storage';

interface ToneSelectorProps {
  selectedTone?: ReminderToneId;
  onSelectTone: (toneId: ReminderToneId) => void;
  showDefaultOption?: boolean;
  compact?: boolean;
}

export const ToneSelector: React.FC<ToneSelectorProps> = ({
  selectedTone,
  onSelectTone,
  showDefaultOption = false,
  compact = false,
}) => {
  const [playingToneId, setPlayingToneId] = useState<string | null>(null);
  const defaultTone = storage.getDefaultTone();
  const effectiveTone = selectedTone || defaultTone;

  const handlePreviewTone = (e: React.MouseEvent, toneId: ReminderToneId) => {
    e.stopPropagation();
    setPlayingToneId(toneId);
    const volume = storage.getVolume();
    playTone(toneId, volume);
    setTimeout(() => {
      setPlayingToneId((curr) => (curr === toneId ? null : curr));
    }, 1200);
  };

  if (compact) {
    return (
      <div className="space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          {AVAILABLE_TONES.map((tone) => {
            const isSelected = effectiveTone === tone.id;
            const isPlaying = playingToneId === tone.id;

            return (
              <div
                key={tone.id}
                id={`tone-option-${tone.id}`}
                onClick={() => onSelectTone(tone.id)}
                className={`flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/80 text-blue-900 ring-1 ring-blue-500 font-semibold shadow-2xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-1">
                  <span className="text-base shrink-0">{tone.icon}</span>
                  <div className="truncate">
                    <span className="truncate block font-medium">{tone.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => handlePreviewTone(e, tone.id)}
                    className={`p-1 rounded-md transition-colors ${
                      isPlaying
                        ? 'bg-amber-400 text-amber-950 animate-pulse'
                        : 'text-slate-400 hover:text-blue-600 hover:bg-blue-100/50'
                    }`}
                    title={`Listen to ${tone.name}`}
                  >
                    {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>
                  {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {AVAILABLE_TONES.map((tone) => {
          const isSelected = effectiveTone === tone.id;
          const isPlaying = playingToneId === tone.id;

          return (
            <div
              key={tone.id}
              id={`tone-card-${tone.id}`}
              onClick={() => onSelectTone(tone.id)}
              className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500 shadow-2xs'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100'
                  }`}
                >
                  {tone.icon}
                </div>
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                      {tone.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-500">
                      {tone.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{tone.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  id={`btn-play-tone-${tone.id}`}
                  onClick={(e) => handlePreviewTone(e, tone.id)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    isPlaying
                      ? 'bg-amber-400 border-amber-500 text-amber-950 animate-pulse'
                      : 'border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  title={`Preview ${tone.name}`}
                >
                  {isPlaying ? (
                    <Square className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                </button>

                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
