import { ItemMemory, Reminder, Language, ReminderToneId, SUPPORTED_LANGUAGES } from '../types';

const ITEMS_KEY = 'remindme_ai_items_v1';
const REMINDERS_KEY = 'remindme_ai_reminders_v1';
const LANGUAGE_KEY = 'remindme_ai_lang_v1';
const DEFAULT_TONE_KEY = 'remindme_ai_tone_v1';
const SOUND_ENABLED_KEY = 'remindme_ai_sound_enabled_v1';
const VOLUME_KEY = 'remindme_ai_volume_v1';

export const defaultInitialItems: ItemMemory[] = [
  {
    id: 'item-1',
    itemName: 'School Certificate',
    location: 'Blue cupboard, 2nd shelf',
    notes: 'Important original 10th and 12th certificates in folder',
    dateTime: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'item-2',
    itemName: 'Phone Charger',
    location: 'Bedroom drawer',
    notes: '65W Fast charger with braided white cable',
    dateTime: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: 'item-3',
    itemName: 'TV Remote',
    location: 'Living room coffee table side pouch',
    notes: 'Smart remote with Netflix button',
    dateTime: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'item-4',
    itemName: 'Spare House Keys',
    location: 'Entrance key hanger behind door',
    notes: 'Keyring with small brass bell',
    dateTime: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const defaultInitialReminders: Reminder[] = [
  {
    id: 'rem-1',
    title: 'Study Maths',
    category: 'Study',
    date: getTodayDateString(),
    time: '19:00',
    repeat: 'weekdays',
    notes: 'Chapter 5 Quadratic equations exercises',
    completed: false,
    enabled: true,
    subject: 'Maths',
    tone: 'marimba',
  },
  {
    id: 'rem-2',
    title: 'Medicine A',
    category: 'Medicine',
    date: getTodayDateString(),
    time: '20:00',
    repeat: 'daily',
    notes: 'Take with warm water after dinner',
    completed: false,
    enabled: true,
    tone: 'urgent-alarm',
  },
  {
    id: 'rem-3',
    title: 'Prepare school bag',
    category: 'Household',
    date: getTodayDateString(),
    time: '21:00',
    repeat: 'weekdays',
    notes: 'Check books, water bottle, geometry box',
    completed: false,
    enabled: true,
    tone: 'digital-pulse',
  },
  {
    id: 'rem-4',
    title: 'Study Science',
    category: 'Study',
    date: getTodayDateString(),
    time: '18:00',
    repeat: 'weekdays',
    notes: 'Physics laws of motion revision',
    completed: true,
    enabled: true,
    subject: 'Science',
    tone: 'zen-bell',
  },
  {
    id: 'rem-5',
    title: 'Buy fresh vegetables',
    category: 'Shopping',
    date: getTodayDateString(),
    time: '17:30',
    repeat: 'once',
    notes: 'Tomatoes, spinach, potatoes',
    completed: false,
    enabled: true,
    tone: 'bubble-pop',
  },
];

// Reactive subscribers
type StorageListener = () => void;
const listeners: Set<StorageListener> = new Set();

function notifyListeners() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (e) {
      console.error('Storage listener error:', e);
    }
  });
}

export function subscribeStorage(callback: StorageListener) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export const storage = {
  // ITEMS
  getItems(): ItemMemory[] {
    try {
      const data = localStorage.getItem(ITEMS_KEY);
      if (!data) {
        localStorage.setItem(ITEMS_KEY, JSON.stringify(defaultInitialItems));
        return defaultInitialItems;
      }
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to read items from localStorage:', err);
      return defaultInitialItems;
    }
  },

  saveItem(itemInput: { itemName: string; location: string; photo?: string; notes?: string; id?: string }): ItemMemory {
    const items = this.getItems();
    const now = new Date().toISOString();

    if (itemInput.id) {
      // Update
      const index = items.findIndex((i) => i.id === itemInput.id);
      if (index !== -1) {
        items[index] = {
          ...items[index],
          itemName: itemInput.itemName.trim(),
          location: itemInput.location.trim(),
          photo: itemInput.photo !== undefined ? itemInput.photo : items[index].photo,
          notes: itemInput.notes !== undefined ? itemInput.notes.trim() : items[index].notes,
          dateTime: now,
        };
        localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
        notifyListeners();
        return items[index];
      }
    }

    // New item
    const newItem: ItemMemory = {
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemName: itemInput.itemName.trim(),
      location: itemInput.location.trim(),
      photo: itemInput.photo,
      notes: itemInput.notes?.trim(),
      dateTime: now,
    };
    items.unshift(newItem);
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    notifyListeners();
    return newItem;
  },

  deleteItem(id: string): void {
    const items = this.getItems().filter((i) => i.id !== id);
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    notifyListeners();
  },

  // REMINDERS
  getReminders(): Reminder[] {
    try {
      const data = localStorage.getItem(REMINDERS_KEY);
      if (!data) {
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(defaultInitialReminders));
        return defaultInitialReminders;
      }
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to read reminders from localStorage:', err);
      return defaultInitialReminders;
    }
  },

  saveReminder(reminderInput: Omit<Reminder, 'id'> & { id?: string }): Reminder {
    const reminders = this.getReminders();
    if (reminderInput.id) {
      const index = reminders.findIndex((r) => r.id === reminderInput.id);
      if (index !== -1) {
        reminders[index] = {
          ...reminders[index],
          ...reminderInput,
          id: reminderInput.id,
        };
        localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
        notifyListeners();
        return reminders[index];
      }
    }

    const newReminder: Reminder = {
      ...reminderInput,
      id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      completed: reminderInput.completed ?? false,
      enabled: reminderInput.enabled ?? true,
    };
    reminders.push(newReminder);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    notifyListeners();
    return newReminder;
  },

  deleteReminder(id: string): void {
    const reminders = this.getReminders().filter((r) => r.id !== id);
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    notifyListeners();
  },

  toggleReminderComplete(id: string): Reminder | null {
    const reminders = this.getReminders();
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return null;
    rem.completed = !rem.completed;
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    notifyListeners();
    return rem;
  },

  toggleReminderEnabled(id: string): Reminder | null {
    const reminders = this.getReminders();
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return null;
    rem.enabled = !rem.enabled;
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    notifyListeners();
    return rem;
  },

  snoozeReminder(id: string, minutes: number = 15): Reminder | null {
    const reminders = this.getReminders();
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return null;
    const snoozeTime = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    rem.snoozedUntil = snoozeTime;
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    notifyListeners();
    return rem;
  },

  skipRecurringReminder(id: string): Reminder | null {
    const reminders = this.getReminders();
    const rem = reminders.find((r) => r.id === id);
    if (!rem) return null;
    // Mark completed for today without disabling the recurrence schedule
    rem.completed = true;
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
    notifyListeners();
    return rem;
  },

  // RESET / BACKUP
  resetToDefaults(): void {
    localStorage.setItem(ITEMS_KEY, JSON.stringify(defaultInitialItems));
    localStorage.setItem(REMINDERS_KEY, JSON.stringify(defaultInitialReminders));
    notifyListeners();
  },

  clearAll(): void {
    localStorage.setItem(ITEMS_KEY, JSON.stringify([]));
    localStorage.setItem(REMINDERS_KEY, JSON.stringify([]));
    notifyListeners();
  },

  exportData(): string {
    const items = this.getItems();
    const reminders = this.getReminders();
    return JSON.stringify({ items, reminders, exportedAt: new Date().toISOString() }, null, 2);
  },

  importData(data: string | { items?: ItemMemory[]; reminders?: Reminder[] }): boolean {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (Array.isArray(parsed.items) || Array.isArray(parsed.reminders)) {
        if (Array.isArray(parsed.items)) {
          localStorage.setItem(ITEMS_KEY, JSON.stringify(parsed.items));
        }
        if (Array.isArray(parsed.reminders)) {
          localStorage.setItem(REMINDERS_KEY, JSON.stringify(parsed.reminders));
        }
        notifyListeners();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  // LANGUAGE
  getLanguage(): Language {
    try {
      const saved = localStorage.getItem(LANGUAGE_KEY) as Language;
      const isValid = SUPPORTED_LANGUAGES.some((l) => l.code === saved);
      return isValid ? saved : 'en';
    } catch {
      return 'en';
    }
  },

  setLanguage(lang: Language): void {
    try {
      localStorage.setItem(LANGUAGE_KEY, lang);
      notifyListeners();
    } catch (e) {
      console.error(e);
    }
  },

  // TONE & NOTIFICATION AUDIO PREFERENCES
  getDefaultTone(): ReminderToneId {
    try {
      const saved = localStorage.getItem(DEFAULT_TONE_KEY) as ReminderToneId;
      const validTones: ReminderToneId[] = [
        'chime',
        'marimba',
        'digital-pulse',
        'zen-bell',
        'radar-ping',
        'harp-arpeggio',
        'urgent-alarm',
        'bubble-pop',
      ];
      return validTones.includes(saved) ? saved : 'chime';
    } catch {
      return 'chime';
    }
  },

  setDefaultTone(tone: ReminderToneId): void {
    try {
      localStorage.setItem(DEFAULT_TONE_KEY, tone);
      notifyListeners();
    } catch (e) {
      console.error(e);
    }
  },

  isSoundEnabled(): boolean {
    try {
      const saved = localStorage.getItem(SOUND_ENABLED_KEY);
      return saved === null ? true : saved === 'true';
    } catch {
      return true;
    }
  },

  setSoundEnabled(enabled: boolean): void {
    try {
      localStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
      notifyListeners();
    } catch (e) {
      console.error(e);
    }
  },

  getVolume(): number {
    try {
      const saved = localStorage.getItem(VOLUME_KEY);
      if (saved === null) return 0.85;
      const num = parseFloat(saved);
      return isNaN(num) ? 0.85 : Math.max(0.1, Math.min(1, num));
    } catch {
      return 0.85;
    }
  },

  setVolume(volume: number): void {
    try {
      const clamped = Math.max(0.1, Math.min(1, volume));
      localStorage.setItem(VOLUME_KEY, String(clamped));
      notifyListeners();
    } catch (e) {
      console.error(e);
    }
  },

  // Aliases for convenience
  addItem(item: { itemName: string; location: string; photo?: string; notes?: string }): ItemMemory {
    return this.saveItem(item);
  },
  updateItem(id: string, item: Partial<ItemMemory>): ItemMemory | null {
    const existing = this.getItems().find((i) => i.id === id);
    if (!existing) return null;
    return this.saveItem({
      id,
      itemName: item.itemName ?? existing.itemName,
      location: item.location ?? existing.location,
      photo: item.photo !== undefined ? item.photo : existing.photo,
      notes: item.notes !== undefined ? item.notes : existing.notes,
    });
  },
  addReminder(reminder: Omit<Reminder, 'id'>): Reminder {
    return this.saveReminder(reminder);
  },
  updateReminder(id: string, reminder: Partial<Reminder>): Reminder | null {
    const existing = this.getReminders().find((r) => r.id === id);
    if (!existing) return null;
    return this.saveReminder({
      ...existing,
      ...reminder,
      id,
    });
  },
  resetToDemo(): void {
    this.resetToDefaults();
  },
};

export const storageService = storage;

