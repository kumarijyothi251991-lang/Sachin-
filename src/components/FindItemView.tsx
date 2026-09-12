import React, { useState, useMemo } from 'react';
import { Search, Mic, MapPin, Clock, FileText, ArrowLeft, PlusCircle, AlertCircle, X } from 'lucide-react';
import { ItemMemory, Language } from '../types';
import { translations } from '../i18n/translations';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface FindItemViewProps {
  items: ItemMemory[];
  language: Language;
  onOpenRememberModal: () => void;
  onBackToHome: () => void;
  onEditItem?: (item: ItemMemory) => void;
}

export const FindItemView: React.FC<FindItemViewProps> = ({
  items,
  language,
  onOpenRememberModal,
  onBackToHome,
  onEditItem,
}) => {
  const t = translations[language];
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Voice hook
  const { isListening, toggleListening, isSupported } = useVoiceInput({
    language,
    onResult: (transcript) => {
      setQuery(transcript);
      setHasSearched(true);
    },
  });

  const handleInputChange = (val: string) => {
    setQuery(val);
    if (val.trim()) {
      setHasSearched(true);
    }
  };

  // Search logic: handles similar words, partial matching, natural language queries like "Where did I keep my X?"
  const searchResults = useMemo(() => {
    if (!query.trim()) {
      return items;
    }

    const clean = query.toLowerCase().trim();
    // Strip common filler phrases from natural speech like "where did i keep my", "where is", "mera charger kahan hai"
    const strippedQuery = clean
      .replace(/^(where did i keep (my|the)?|where is (my|the)?|find (my|the)?|where are|search for|kahan hai|kidhar hai|mera|meri|mere)/gi, '')
      .replace(/(kahan hai|kidhar rakha hai|in the house|kept|placed)\??$/gi, '')
      .trim();

    const targetWords = (strippedQuery || clean).split(/\s+/).filter((w) => w.length > 1);

    return items.filter((item) => {
      const name = item.itemName.toLowerCase();
      const loc = item.location.toLowerCase();
      const notes = (item.notes || '').toLowerCase();

      // Direct inclusion of clean or stripped query
      if (name.includes(clean) || (strippedQuery && name.includes(strippedQuery))) return true;
      if (loc.includes(clean) || (strippedQuery && loc.includes(strippedQuery))) return true;

      // Word-level matching (e.g. "remote" matching "TV remote")
      const matchesWord = targetWords.some((w) => name.includes(w) || loc.includes(w) || notes.includes(w));
      if (matchesWord) return true;

      return false;
    });
  }, [items, query]);

  // Format date nicely
  const formatRecordedTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const today = new Date();
      const isToday = d.toDateString() === today.toDateString();

      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) {
        return language === 'hi' ? `आज, ${timeStr}` : `Today, ${timeStr}`;
      }
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${timeStr}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto">
      {/* Top Bar */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBackToHome}
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-200/60 transition-colors"
          title="Back to Home"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">
            {t.findItemBtn}
          </h2>
          <p className="text-xs text-slate-500">
            {t.searchPlaceholder}
          </p>
        </div>
      </div>

      {/* Search Input Box with Voice */}
      <div className="relative bg-white rounded-2xl border border-slate-200 shadow-sm p-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        <Search className="w-5 h-5 text-slate-400 shrink-0 ml-2" />
        <input
          id="input-find-item"
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="flex-1 text-sm bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 py-1"
        />

        {query && (
          <button
            onClick={() => setQuery('')}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          id="btn-voice-find"
          onClick={toggleListening}
          disabled={!isSupported}
          className={`p-2.5 rounded-xl transition-all ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse shadow-md'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
          title={isListening ? t.voiceListening : t.voiceSpeakHint}
        >
          <Mic className="w-4 h-4" />
        </button>
      </div>

      {isListening && (
        <div className="flex items-center gap-2 px-2 text-xs text-rose-600 font-semibold animate-pulse">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>{t.voiceListening}</span>
        </div>
      )}

      {/* Quick Search Chips */}
      {!query && items.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {t.examplesTitle}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {items.slice(0, 4).map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setQuery(item.itemName);
                  setHasSearched(true);
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
              >
                {item.itemName}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results List */}
      <div className="space-y-3 pt-1">
        {searchResults.length > 0 ? (
          <>
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>
                {t.allMemories} ({searchResults.length})
              </span>
            </div>

            {searchResults.map((item) => (
              <div
                key={item.id}
                id={`result-item-${item.id}`}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.itemName}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0 font-bold">
                        📦
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-slate-900 leading-snug truncate">
                        {item.itemName}
                      </h3>

                      {/* Location Badge */}
                      <div className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-blue-700">
                        <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>{item.location}</span>
                      </div>

                      {/* Recorded Time */}
                      <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {t.lastRecorded}: {formatRecordedTime(item.dateTime)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {onEditItem && (
                    <button
                      onClick={() => onEditItem(item)}
                      className="text-xs font-semibold text-slate-500 hover:text-blue-600 px-2 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 shrink-0"
                    >
                      {t.edit}
                    </button>
                  )}
                </div>

                {item.notes && (
                  <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-xs text-slate-600">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{item.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
          /* NOT FOUND EMPTY STATE (Strictly follows requirement: "I don't have a saved location for this item yet.") */
          <div className="text-center py-10 px-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">
                {t.notFoundItem}
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {language === 'hi'
                  ? 'RemindMe AI कभी मनगढ़ंत उत्तर नहीं देता। आप इसे अभी सहेज सकते हैं:'
                  : 'RemindMe AI never invents a location. Would you like to record it now?'}
              </p>
            </div>
            <button
              id="btn-remember-not-found"
              onClick={onOpenRememberModal}
              className="inline-flex items-center gap-1.5 py-2.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-98 shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.rememberItemBtn}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
