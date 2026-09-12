import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Mic,
  MicOff,
  Sparkles,
  X,
  Check,
  AlertCircle,
  MapPin,
  Tag,
  FileText,
  Loader2,
  Trash2,
} from 'lucide-react';
import { Language, ItemMemory } from '../types';
import { translations } from '../i18n/translations';
import { aiService } from '../services/aiService';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface RememberItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: { itemName: string; location: string; photo?: string; notes?: string; id?: string }) => void;
  language: Language;
  editingItem?: ItemMemory | null;
}

export const RememberItemModal: React.FC<RememberItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  language,
  editingItem,
}) => {
  const t = translations[language];

  // Mode: 'natural' or 'form'
  const [mode, setMode] = useState<'natural' | 'form'>('natural');
  const [naturalText, setNaturalText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [hasExtracted, setHasExtracted] = useState(false);

  // Form fields
  const [itemName, setItemName] = useState(editingItem ? editingItem.itemName : '');
  const [location, setLocation] = useState(editingItem ? editingItem.location : '');
  const [notes, setNotes] = useState(editingItem ? editingItem.notes || '' : '');
  const [photo, setPhoto] = useState<string | undefined>(editingItem?.photo);
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Reset when opened/closed
  React.useEffect(() => {
    if (editingItem) {
      setItemName(editingItem.itemName);
      setLocation(editingItem.location);
      setNotes(editingItem.notes || '');
      setPhoto(editingItem.photo);
      setMode('form');
      setHasExtracted(false);
      setNaturalText('');
    } else {
      setItemName('');
      setLocation('');
      setNotes('');
      setPhoto(undefined);
      setMode('natural');
      setHasExtracted(false);
      setNaturalText('');
    }
    setErrorMessage('');
  }, [editingItem, isOpen]);

  // Voice hook
  const { isListening, toggleListening, isSupported: isVoiceSupported } = useVoiceInput({
    language,
    onResult: (transcript) => {
      setNaturalText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    },
    onError: (err) => {
      setErrorMessage(err);
    },
  });

  if (!isOpen) return null;

  // Handle Natural Language Extraction
  const handleExtract = async () => {
    if (!naturalText.trim()) {
      setErrorMessage(t.naturalReminderHint);
      return;
    }
    setErrorMessage('');
    setIsExtracting(true);

    try {
      const extracted = await aiService.parseItem(naturalText);
      setItemName(extracted.itemName || '');
      setLocation(extracted.location || '');
      if (extracted.notes) {
        setNotes((prev) => (prev ? `${prev}; ${extracted.notes}` : extracted.notes || ''));
      }
      setHasExtracted(true);
      setMode('form');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(t.notFoundItem);
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle Image Selection
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Photo size must be less than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setPhoto(base64);

      // Auto analyze photo with Gemini Vision if item name is empty
      if (!itemName.trim()) {
        setIsAnalyzingPhoto(true);
        try {
          const analysis = await aiService.analyzePhoto(base64, file.type);
          if (analysis.itemName && !itemName.trim()) {
            setItemName(analysis.itemName);
          }
          if (analysis.description && !notes) {
            setNotes(analysis.description);
          }
          if (analysis.visibleLocationHint && !location.trim()) {
            setLocation(analysis.visibleLocationHint);
          }
        } catch (err) {
          console.warn('Auto vision failed:', err);
        } finally {
          setIsAnalyzingPhoto(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle Save
  const handleSave = () => {
    if (!itemName.trim()) {
      setErrorMessage(t.itemName);
      return;
    }
    if (!location.trim()) {
      setErrorMessage(t.location);
      return;
    }

    onSave({
      id: editingItem?.id,
      itemName: itemName.trim(),
      location: location.trim(),
      notes: notes.trim() || undefined,
      photo,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div
        id="modal-remember-item"
        className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
              📦
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {editingItem ? t.edit : t.rememberItemBtn}
              </h2>
              <p className="text-xs text-slate-500">
                {t.location}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Mode switch */}
          {!editingItem && (
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('natural')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'natural'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>AI</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('form')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  mode === 'form'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Tag className="w-3.5 h-3.5 text-slate-600" />
                <span>{t.details}</span>
              </button>
            </div>
          )}

          {/* NATURAL LANGUAGE INPUT */}
          {mode === 'natural' && !editingItem && (
            <div className="space-y-3 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <label className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>{t.naturalLanguageHint}</span>
              </label>

              <div className="relative">
                <textarea
                  id="input-natural-item"
                  rows={3}
                  value={naturalText}
                  onChange={(e) => setNaturalText(e.target.value)}
                  placeholder={t.naturalLanguageHint}
                  className="w-full text-sm p-3 pr-12 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400"
                />

                {/* Voice mic button */}
                <button
                  type="button"
                  id="btn-mic-natural-item"
                  onClick={toggleListening}
                  disabled={!isVoiceSupported}
                  className={`absolute right-2 bottom-3 p-2 rounded-xl transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={isListening ? t.voiceListening : t.voiceSpeakHint}
                >
                  {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              </div>

              {isListening && (
                <div className="flex items-center gap-2 text-xs text-rose-600 font-semibold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>{t.voiceListening}</span>
                </div>
              )}

              <button
                type="button"
                id="btn-extract-item"
                onClick={handleExtract}
                disabled={isExtracting || !naturalText.trim()}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-98 disabled:opacity-50 transition-all shadow-xs"
              >
                {isExtracting ? (
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
          )}

          {/* AI UNDERSTOOD CONFIRMATION BOX */}
          {hasExtracted && (
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{t.aiUnderstoodTitle}</span>
              </div>
              <div className="text-sm text-emerald-950 font-medium space-y-1">
                <div>
                  <span className="text-emerald-700 text-xs uppercase font-bold">{t.itemName}: </span>
                  <span className="font-bold">{itemName || '—'}</span>
                </div>
                <div>
                  <span className="text-emerald-700 text-xs uppercase font-bold">{t.location}: </span>
                  <span className="font-bold">{location || '—'}</span>
                </div>
              </div>
            </div>
          )}

          {/* FORM FIELDS */}
          <div className="space-y-3.5">
            {/* Item Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.itemName} *</span>
              </label>
              <input
                id="input-item-name"
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. School Certificate, TV Remote, Passport"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.location} *</span>
              </label>
              <input
                id="input-item-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Blue cupboard, second shelf"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>{t.notesOptional}</span>
              </label>
              <input
                id="input-item-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Important original documents in yellow folder"
                className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Photo Section */}
            <div className="space-y-2 pt-1">
              <label className="block text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t.takePhoto}</span>
                </span>
                {isAnalyzingPhoto && (
                  <span className="text-[11px] text-indigo-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{t.searching}</span>
                  </span>
                )}
              </label>

              {photo ? (
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-48 flex items-center justify-center">
                  <img
                    src={photo}
                    alt="Captured Item"
                    className="max-h-48 w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setPhoto(undefined)}
                    className="absolute top-2 right-2 p-1.5 rounded-xl bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                    title="Remove Photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <button
                    type="button"
                    id="btn-take-photo"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold active:scale-98 transition-all"
                  >
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span>{t.takePhoto}</span>
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                  <button
                    type="button"
                    id="btn-upload-photo"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold active:scale-98 transition-all"
                  >
                    <Upload className="w-4 h-4 text-slate-600" />
                    <span>{t.uploadPhoto}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Strict tracking disclaimer */}
            <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-[11px] text-amber-800 leading-tight">
              {t.disclaimerTracking}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 active:scale-98 transition-colors"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            id="btn-save-to-memory"
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-98 shadow-sm transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{t.saveToMemory}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
