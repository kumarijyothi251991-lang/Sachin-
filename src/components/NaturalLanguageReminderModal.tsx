import React, { useState } from 'react';
import {
  Sparkles,
  Mic,
  X,
  Check,
  Edit2,
  AlertCircle,
  Clock,
  Calendar,
  Repeat,
  Loader2,
  Tag,
} from 'lucide-react';
import { Reminder, ReminderCategory, ReminderRepeat, ReminderToneId, Language } from '../types';
import { translations, categoryMeta, getCategoryLabel, getRepeatLabel } from '../i18n/translations';
import { aiService } from '../services/aiService';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { storage } from '../services/storage';
import { AVAILABLE_TONES, playTone } from '../services/toneService';
import { Volume2, Music } from 'lucide-react';

interface NaturalLanguageReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSave: (reminder: Omit<Reminder, 'id'>) => void;
  onSwitchToEdit: (extracted: {
    title: string;
    category: ReminderCategory;
    date: string;
    time: string;
    repeat: ReminderRepeat;
    notes?: string;
    tone?: ReminderToneId;
  }) => void;
  language: Language;
}

export const NaturalLanguageReminderModal: React.FC<NaturalLanguageReminderModalProps> = ({
  isOpen,
  onClose,
  onConfirmSave,
  onSwitchToEdit,
  language,
}) => {
  const t = translations[language];
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Extracted confirmation state
  const [extractedData, setExtractedData] = useState<{
    title: string;
    category: ReminderCategory;
    date: string;
    time: string;
    repeat: ReminderRepeat;
    notes?: string;
    tone?: ReminderToneId;
    isAmbiguous?: boolean;
    clarificationQuestion?: string;
  } | null>(null);

  const [selectedTone, setSelectedTone] = useState<ReminderToneId>(() => storage.getDefaultTone());

  // Voice recognition
  const { isListening, toggleListening, isSupported } = useVoiceInput({
    language,
    onResult: (transcript) => {
      setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    },
    onError: (err) => {
      setErrorMessage(err);
    },
  });

  if (!isOpen) return null;

  const examplePrompts = t.suggestedQuestions && t.suggestedQuestions.length > 0 ? t.suggestedQuestions : [
    'I have to study maths every evening at 7',
    'Remind me tomorrow at 8 AM to take my medicine',
    'Tomorrow I need to buy vegetables',
    'Remind me every Sunday to clean the water filter',
  ];

  const handleParse = async () => {
    if (!inputText.trim()) {
      setErrorMessage(t.naturalReminderHint);
      return;
    }
    setErrorMessage('');
    setIsLoading(true);

    try {
      const data = await aiService.parseReminder(inputText);
      setExtractedData(data);
      if (data.category === 'Medicine') {
        setSelectedTone('urgent-alarm');
      } else if (data.category === 'Study') {
        setSelectedTone('marimba');
      } else {
        setSelectedTone(storage.getDefaultTone());
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(t.notFoundItem);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (!extractedData) return;
    onConfirmSave({
      title: extractedData.title,
      category: extractedData.category,
      date: extractedData.date,
      time: extractedData.time,
      repeat: extractedData.repeat,
      notes: extractedData.notes,
      tone: selectedTone,
      completed: false,
      enabled: true,
      subject: extractedData.category === 'study' ? extractedData.title.replace(/study/i, '').trim() : undefined,
    });
    onClose();
  };

  const handleEdit = () => {
    if (!extractedData) return;
    onSwitchToEdit({
      ...extractedData,
      tone: selectedTone,
    });
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div
        id="modal-natural-reminder"
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                AI {t.createReminder}
              </h2>
              <p className="text-xs text-slate-500">
                {t.naturalReminderHint}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {!extractedData ? (
            /* INPUT SCREEN */
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                {t.appTagline}
              </label>

              <div className="relative">
                <textarea
                  id="input-natural-reminder-text"
                  rows={3}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={t.naturalReminderHint}
                  className="w-full text-sm p-3 pr-12 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                />

                <button
                  type="button"
                  id="btn-voice-natural-reminder"
                  onClick={toggleListening}
                  disabled={!isSupported}
                  className={`absolute right-2.5 bottom-3.5 p-2 rounded-xl transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={isListening ? t.voiceListening : t.voiceSpeakHint}
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>

              {isListening && (
                <div className="flex items-center gap-2 text-xs text-rose-600 font-semibold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>{t.voiceListening}</span>
                </div>
              )}

              {/* Suggestions */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {t.examplesTitle}
                </span>
                <div className="flex flex-col gap-1.5">
                  {examplePrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setInputText(prompt)}
                      className="text-left text-xs bg-slate-50 hover:bg-blue-50/60 hover:text-blue-700 text-slate-700 p-2.5 rounded-xl border border-slate-200 transition-colors"
                    >
                      “{prompt}”
                    </button>
                  ))}
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="button"
                id="btn-process-natural-reminder"
                onClick={handleParse}
                disabled={isLoading || !inputText.trim()}
                className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-98 disabled:opacity-50 transition-all shadow-sm mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.searching}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t.confirm}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* CONFIRMATION SCREEN */
            <div className="space-y-4 animate-in fade-in">
              <div className="bg-emerald-50/80 border border-emerald-200 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-800">
                  <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <h3 className="text-sm font-bold">{t.aiUnderstoodTitle}</h3>
                </div>

                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs space-y-2.5 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[11px] w-16 shrink-0 mt-0.5">{t.reminderTitle}:</span>
                    <span className="font-bold text-slate-900 text-base">{extractedData.title}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[11px] w-16 shrink-0">{t.time}:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {formatDisplayTime(extractedData.time)} ({extractedData.time})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[11px] w-16 shrink-0">{t.date}:</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {extractedData.date}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[11px] w-16 shrink-0">{t.repeat}:</span>
                    <span className="font-medium text-slate-700 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-slate-500" />
                      {getRepeatLabel(extractedData.repeat, language)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[11px] w-16 shrink-0">{t.category}:</span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                      {categoryMeta[extractedData.category]?.icon} {getCategoryLabel(extractedData.category, language)}
                    </span>
                  </div>

                  {/* Notification Tone Preview */}
                  {(() => {
                    const toneInfo = AVAILABLE_TONES.find((i) => i.id === selectedTone) || AVAILABLE_TONES[0];
                    return (
                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-bold uppercase text-[11px] w-16 shrink-0">Tone:</span>
                          <span className="font-semibold text-blue-900 flex items-center gap-1">
                            <span>{toneInfo.icon}</span>
                            <span>{toneInfo.name}</span>
                          </span>
                        </div>
                        <button
                          id="btn-preview-natural-tone"
                          type="button"
                          onClick={() => {
                            const volume = storage.getVolume();
                            playTone(selectedTone, volume);
                          }}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px] border border-blue-200"
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>Preview Tone</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Clarification prompt if ambiguous */}
                {extractedData.isAmbiguous && (
                  <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                    <span>
                      {extractedData.clarificationQuestion || t.reminderSubGen}
                    </span>
                  </div>
                )}
              </div>

              {/* Action buttons: CONFIRM / EDIT */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  id="btn-confirm-reminder"
                  onClick={handleConfirm}
                  className="py-3 px-4 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 active:scale-98 shadow-sm flex items-center justify-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.confirm}</span>
                </button>

                <button
                  type="button"
                  id="btn-edit-reminder"
                  onClick={handleEdit}
                  className="py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-sm hover:bg-slate-100 active:scale-98 flex items-center justify-center gap-2 transition-all"
                >
                  <Edit2 className="w-4 h-4 text-slate-500" />
                  <span>{t.edit}</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setExtractedData(null)}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-800 underline py-1"
              >
                ← {t.clearSearch}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
