import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Clock,
  Calendar,
  Repeat,
  FileText,
  AlertCircle,
  Pill,
  BookOpen,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { Reminder, ReminderCategory, ReminderRepeat, ReminderToneId, Language } from '../types';
import { translations, categoryMeta, getCategoryLabel, getRepeatLabel } from '../i18n/translations';
import { getTodayDateString, storage } from '../services/storage';
import { ToneSelector } from './ToneSelector';
import { AVAILABLE_TONES, playTone } from '../services/toneService';
import { Music, Volume2, Play, Square } from 'lucide-react';

interface CreateReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: Omit<Reminder, 'id'> & { id?: string }) => void;
  language: Language;
  editingReminder?: Reminder | null;
  initialCategory?: ReminderCategory;
}

export const CreateReminderModal: React.FC<CreateReminderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  language,
  editingReminder,
  initialCategory,
}) => {
  const t = translations[language];

  // Tab: 'standard' | 'medicine' | 'study'
  const [formType, setFormType] = useState<'standard' | 'medicine' | 'study'>('standard');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReminderCategory>('other');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState('19:00');
  const [repeat, setRepeat] = useState<ReminderRepeat>('once');
  const [notes, setNotes] = useState('');
  const [subject, setSubject] = useState('Maths');
  const [tone, setTone] = useState<ReminderToneId>(() => storage.getDefaultTone());
  const [errorMessage, setErrorMessage] = useState('');

  // Study multi-subject fast schedules
  const studySubjectPresets = [
    { name: 'Science', time: '18:00' },
    { name: 'Maths', time: '19:00' },
    { name: 'Computer', time: '20:00' },
    { name: 'English', time: '17:00' },
  ];

  useEffect(() => {
    if (editingReminder) {
      setTitle(editingReminder.title);
      setCategory(editingReminder.category);
      setDate(editingReminder.date);
      setTime(editingReminder.time);
      setRepeat(editingReminder.repeat);
      setNotes(editingReminder.notes || '');
      setSubject(editingReminder.subject || '');
      setTone(editingReminder.tone || storage.getDefaultTone());
      if (editingReminder.category === 'Medicine') setFormType('medicine');
      else if (editingReminder.category === 'Study') setFormType('study');
      else setFormType('standard');
    } else {
      setDate(getTodayDateString());
      setTime('19:00');
      setRepeat('once');
      setNotes('');
      setSubject('Maths');
      if (initialCategory === 'Medicine') {
        setFormType('medicine');
        setCategory('Medicine');
        setTitle('Medicine A');
        setRepeat('daily');
        setTime('08:00');
        setTone('urgent-alarm');
      } else if (initialCategory === 'Study') {
        setFormType('study');
        setCategory('Study');
        setTitle('Study Maths');
        setRepeat('weekdays');
        setTime('19:00');
        setTone('marimba');
      } else {
        setFormType('standard');
        setCategory(initialCategory || 'Other');
        setTitle('');
        setTone(storage.getDefaultTone());
      }
    }
    setErrorMessage('');
  }, [editingReminder, initialCategory, isOpen]);

  if (!isOpen) return null;

  const handleFormTypeChange = (type: 'standard' | 'medicine' | 'study') => {
    setFormType(type);
    if (type === 'medicine') {
      setCategory('Medicine');
      if (!title || title.includes('Study')) setTitle('Medicine A');
      if (repeat === 'once') setRepeat('daily');
      if (time === '19:00') setTime('08:00');
    } else if (type === 'study') {
      setCategory('Study');
      setTitle(`Study ${subject || 'Maths'}`);
      setRepeat('weekdays');
      if (time === '08:00') setTime('19:00');
    }
  };

  const handleApplySubjectPreset = (preset: { name: string; time: string }) => {
    setSubject(preset.name);
    setTitle(`Study ${preset.name}`);
    setTime(preset.time);
    setCategory('Study');
    setRepeat('weekdays');
  };

  const handleSave = () => {
    if (!title.trim()) {
      setErrorMessage(t.reminderTitle);
      return;
    }
    if (!date) {
      setErrorMessage(t.date);
      return;
    }
    if (!time) {
      setErrorMessage(t.time);
      return;
    }

    onSave({
      id: editingReminder?.id,
      title: title.trim(),
      category,
      date,
      time,
      repeat,
      notes: notes.trim() || undefined,
      tone,
      completed: editingReminder?.completed ?? false,
      enabled: editingReminder?.enabled ?? true,
      subject: formType === 'study' ? subject || title : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
      <div
        id="modal-create-reminder"
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
              ⏰
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingReminder ? t.edit : t.createReminder}
              </h2>
              <p className="text-xs text-slate-500">
                {formType === 'medicine'
                  ? getCategoryLabel('Medicine', language)
                  : formType === 'study'
                  ? getCategoryLabel('Study', language)
                  : t.reminderSubGen}
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Preset Selector */}
          {!editingReminder && (
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => handleFormTypeChange('standard')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                  formType === 'standard' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                <span>🔔 {t.today}</span>
              </button>
              <button
                type="button"
                id="tab-medicine-preset"
                onClick={() => handleFormTypeChange('medicine')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                  formType === 'medicine' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                <Pill className="w-3.5 h-3.5 text-rose-600" />
                <span>{getCategoryLabel('Medicine', language)}</span>
              </button>
              <button
                type="button"
                id="tab-study-preset"
                onClick={() => handleFormTypeChange('study')}
                className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-all ${
                  formType === 'study' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>{getCategoryLabel('Study', language)}</span>
              </button>
            </div>
          )}

          {/* DEDICATED MEDICINE DISCLAIMER */}
          {formType === 'medicine' && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-xs text-rose-900">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-tight space-y-1">
                <span className="font-bold">{t.disclaimerTitle}</span>
                <p className="text-[11px] text-rose-800">
                  {t.disclaimerMedicine}
                </p>
              </div>
            </div>
          )}

          {/* DEDICATED STUDY PRESET SHORTCUTS */}
          {formType === 'study' && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-700">
                {getCategoryLabel('Study', language)} {t.examplesTitle}
              </span>
              <div className="grid grid-cols-2 gap-2">
                {studySubjectPresets.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplySubjectPreset(preset)}
                    className={`py-2 px-3 rounded-xl border text-left text-xs transition-all ${
                      subject === preset.name
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div className="font-semibold">{preset.name}</div>
                    <div className="text-[11px] text-slate-500">{preset.time}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t.reminderTitle} *
            </label>
            <input
              id="input-reminder-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                formType === 'medicine'
                  ? 'e.g. Medicine A, Vitamin D'
                  : formType === 'study'
                  ? 'e.g. Study Maths, Science Revision'
                  : 'e.g. Prepare school bag, Buy vegetables'
              }
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Picker */}
          {formType === 'standard' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.category}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(categoryMeta).map(([catKey, meta]) => {
                  const isSelected = category === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setCategory(catKey as ReminderCategory)}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all truncate ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50 text-blue-800 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-sm">{meta.icon}</span>
                      <span className="truncate">{getCategoryLabel(catKey as ReminderCategory, language)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.date} *</span>
              </label>
              <input
                id="input-reminder-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.time} *</span>
              </label>
              <input
                id="input-reminder-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Repeat options */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.repeat}</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {(['once', 'daily', 'weekdays', 'weekly', 'custom'] as ReminderRepeat[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRepeat(r)}
                  className={`py-1.5 px-2 text-xs font-semibold rounded-xl border text-center transition-all ${
                    repeat === r
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {getRepeatLabel(r, language)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>{t.notesOptional}</span>
            </label>
            <input
              id="input-reminder-notes"
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                formType === 'medicine'
                  ? 'e.g. Take with warm water after food'
                  : 'e.g. Chapter 4 exercises, bring notebook'
              }
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notification Tone Picker */}
          <div className="pt-1">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-blue-600" />
                <span>Notification Tone &amp; Sound</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Tap ▶ to preview
              </span>
            </div>
            <ToneSelector
              selectedTone={tone}
              onSelectTone={setTone}
              compact={true}
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            id="btn-save-reminder"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-98 shadow-sm flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{t.saveReminder}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
