import React, { useRef, useState } from 'react';
import {
  Globe,
  Bell,
  Volume2,
  VolumeX,
  Music,
  ShieldCheck,
  Download,
  Upload,
  RefreshCw,
  Trash2,
  Lock,
  EyeOff,
  Sparkles,
  Info,
  CheckCircle,
  Play,
  Sliders,
} from 'lucide-react';
import { Language, ItemMemory, Reminder, ReminderToneId, SUPPORTED_LANGUAGES } from '../types';
import { translations } from '../i18n/translations';
import { playReminderTone, playNotificationChime } from '../services/notificationService';
import { storage } from '../services/storage';
import { ToneSelector } from './ToneSelector';
import { AVAILABLE_TONES } from '../services/toneService';

interface SettingsViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  notificationPermission: NotificationPermission;
  onRequestNotification: () => void;
  items: ItemMemory[];
  reminders: Reminder[];
  onExportData: () => void;
  onImportData: (data: { items: ItemMemory[]; reminders: Reminder[] }) => void;
  onResetDemoData: () => void;
  onClearAllData: () => void;
  onTestReminderAlert?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  language,
  onLanguageChange,
  notificationPermission,
  onRequestNotification,
  items,
  reminders,
  onExportData,
  onImportData,
  onResetDemoData,
  onClearAllData,
  onTestReminderAlert,
}) => {
  const t = translations[language];
  const fileImportRef = useRef<HTMLInputElement>(null);

  const [selectedTone, setSelectedTone] = useState<ReminderToneId>(() => storage.getDefaultTone());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => storage.isSoundEnabled());
  const [volume, setVolume] = useState<number>(() => storage.getVolume());

  const handleToneChange = (toneId: ReminderToneId) => {
    setSelectedTone(toneId);
    storage.setDefaultTone(toneId);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    storage.setSoundEnabled(next);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    storage.setVolume(val);
  };

  const handleTriggerTest = () => {
    if (onTestReminderAlert) {
      onTestReminderAlert();
    } else {
      playReminderTone(selectedTone);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed.items) || Array.isArray(parsed.reminders)) {
          onImportData({
            items: parsed.items || [],
            reminders: parsed.reminders || [],
          });
          alert(t.itemSavedSuccess);
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Could not parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5 pb-20 max-w-md mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 leading-tight">
          {t.settingsTitle}
        </h2>
        <p className="text-xs text-slate-500">
          {t.privacyTitle} &amp; {t.languageSelection}
        </p>
      </div>

      {/* 1. Language Preference */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">{t.language}</h3>
              <p className="text-xs text-slate-500">
                {t.languageSelection}
              </p>
            </div>
          </div>
        </div>

        {/* Dynamic Multi-Language Grid */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                id={`settings-lang-${lang.code}`}
                onClick={() => onLanguageChange(lang.code)}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-blue-50 border-blue-600 text-blue-700 ring-1 ring-blue-500 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-base">{lang.flag}</span>
                  <div className="text-left truncate">
                    <div className="truncate font-semibold">{lang.nativeName}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{lang.name}</div>
                  </div>
                </div>
                {isSelected && <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Notifications & Audio Alert Tones */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {t.notificationsTitle} &amp; Alert Tones
              </h3>
              <p className="text-xs text-slate-500">
                In-website reminders, sound alerts &amp; custom tones
              </p>
            </div>
          </div>
        </div>

        {/* Browser System Notification Permission */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="space-y-0.5">
            <span className="text-xs font-semibold text-slate-800">
              {notificationPermission === 'granted'
                ? t.notificationsEnabled
                : t.enableNotifications}
            </span>
            <p className="text-[11px] text-slate-500">
              {notificationPermission === 'granted'
                ? 'Desktop & mobile system banners active'
                : 'Allow browser notifications for background reminders'}
            </p>
          </div>

          <button
            id="btn-request-notif"
            onClick={onRequestNotification}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
              notificationPermission === 'granted'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {notificationPermission === 'granted' ? '✓ Granted' : t.enableNotifications}
          </button>
        </div>

        {/* Website Sound Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-lg ${soundEnabled ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'}`}>
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Sound Alert
              </span>
              <span className="text-[11px] text-slate-500">
                {soundEnabled ? 'Play musical tone when reminder is due' : 'Mute notification sound tones'}
              </span>
            </div>
          </div>

          <button
            id="btn-toggle-sound-enabled"
            type="button"
            onClick={handleToggleSound}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              soundEnabled
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {soundEnabled ? 'Enabled' : 'Muted'}
          </button>
        </div>

        {/* Volume Slider */}
        {soundEnabled && (
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Alert Volume</span>
              </span>
              <span className="text-blue-600 font-mono">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              id="input-alert-volume"
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>
        )}

        {/* Default Alert Tone Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Music className="w-4 h-4 text-blue-600" />
              <span>Default Reminder Tone</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Choose &amp; preview 8 synthesized tones
            </span>
          </div>

          <ToneSelector
            selectedTone={selectedTone}
            onSelectTone={handleToneChange}
            compact={false}
          />
        </div>

        {/* Test Trigger Button */}
        <button
          id="btn-test-website-reminder-alert"
          type="button"
          onClick={handleTriggerTest}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <Bell className="w-4 h-4 text-amber-300" />
          <span>Test In-Website Reminder Notification &amp; Tone</span>
        </button>
      </div>

      {/* 3. PRIVACY PRINCIPLES */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">{t.privacyTitle}</h3>
            <p className="text-xs text-slate-500">
              {t.privacy}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{t.privacy1}</span>
          </div>

          <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50">
            <EyeOff className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{t.privacy2}</span>
          </div>

          <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{t.privacy3}</span>
          </div>

          <div className="flex items-start gap-2 p-2 rounded-xl bg-slate-50">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <span className="leading-snug">{t.privacy4}</span>
          </div>

          <div className="flex items-start gap-2 p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="leading-snug font-medium">{t.disclaimerTracking}</span>
          </div>

          <div className="flex items-start gap-2 p-2 rounded-xl bg-rose-50 text-rose-900 border border-rose-200">
            <Info className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="leading-snug font-medium">{t.disclaimerMedicine}</span>
          </div>
        </div>
      </div>

      {/* 4. Data Management (Export, Import, Demo Reset) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <Download className="w-5 h-5 text-slate-700" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {t.exportData}
            </h3>
            <p className="text-xs text-slate-500">
              {items.length} {t.allMemories} • {reminders.length} {t.myRemindersBtn}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Export */}
          <button
            id="btn-export-backup"
            onClick={onExportData}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.exportData}</span>
          </button>

          {/* Import */}
          <input
            ref={fileImportRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            id="btn-import-backup"
            onClick={() => fileImportRef.current?.click()}
            className="py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-slate-600" />
            <span>{t.importData}</span>
          </button>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Reset Demo Data */}
          <button
            id="btn-reset-data"
            onClick={onResetDemoData}
            className="py-2 px-3 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.resetData}</span>
          </button>

          {/* Clear All */}
          <button
            id="btn-clear-all"
            onClick={() => {
              if (window.confirm(t.confirmClearDesc)) {
                onClearAllData();
              }
            }}
            className="py-2 px-3 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-medium flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-500" />
            <span>{t.clearAll}</span>
          </button>
        </div>
      </div>

      {/* App Info Card */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
        <div className="flex items-center justify-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-900">{t.appTitle}</span>
          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full font-bold">
            v1.0
          </span>
        </div>
        <p className="text-[11px] text-slate-500 italic">
          “{t.appTagline}”
        </p>
      </div>
    </div>
  );
};
