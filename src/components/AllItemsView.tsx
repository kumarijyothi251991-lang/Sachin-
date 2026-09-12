import React, { useState } from 'react';
import { Search, Plus, MapPin, Clock, FileText, Trash2, Edit3, Image, AlertTriangle } from 'lucide-react';
import { ItemMemory, Language } from '../types';
import { translations } from '../i18n/translations';

interface AllItemsViewProps {
  items: ItemMemory[];
  language: Language;
  onAddItem: () => void;
  onEditItem: (item: ItemMemory) => void;
  onDeleteItem: (id: string) => void;
}

export const AllItemsView: React.FC<AllItemsViewProps> = ({
  items,
  language,
  onAddItem,
  onEditItem,
  onDeleteItem,
}) => {
  const t = translations[language];
  const [search, setSearch] = useState('');
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.itemName.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q))
    );
  });

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-md mx-auto">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 leading-tight">
            {t.allMemories}
          </h2>
          <p className="text-xs text-slate-500">
            {items.length} {t.allMemories}
          </p>
        </div>
        <button
          id="btn-add-item-memory"
          onClick={onAddItem}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-98 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{t.rememberItemBtn}</span>
        </button>
      </div>

      {/* Search filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full text-sm pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Items list */}
      <div className="space-y-3">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div
              key={item.id}
              id={`item-card-${item.id}`}
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
                    <div className="mt-1 flex items-start gap-1.5 text-sm font-semibold text-blue-700">
                      <MapPin className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <span>{item.location}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{formatDate(item.dateTime)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEditItem(item)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                    title={t.edit}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setItemToDelete(item.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title={t.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {item.notes && (
                <div className="pt-2 border-t border-slate-100 flex items-start gap-1.5 text-xs text-slate-600">
                  <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{item.notes}</span>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-slate-200 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl">
              📦
            </div>
            <h4 className="text-sm font-bold text-slate-800">
              {search ? t.notFoundItem : t.noRecentItems}
            </h4>
            {!search && (
              <button
                onClick={onAddItem}
                className="inline-flex items-center gap-1.5 py-2 px-4 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-98 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{t.rememberItemBtn}</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-xs w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-900">
                {t.confirmClearTitle}
              </h4>
              <p className="text-xs text-slate-500">
                {t.confirmClearDesc}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="py-2 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => {
                  onDeleteItem(itemToDelete);
                  setItemToDelete(null);
                }}
                className="py-2 px-3 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-700"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
