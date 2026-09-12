export type ReminderCategory =
  | 'Medicine'
  | 'Study'
  | 'Household'
  | 'Appointment'
  | 'Birthday'
  | 'Shopping'
  | 'Work'
  | 'Health Habit'
  | 'Other';

export type ReminderRepeat = 'once' | 'daily' | 'weekly' | 'weekdays' | 'custom';

export type ReminderToneId =
  | 'chime'
  | 'marimba'
  | 'digital-pulse'
  | 'zen-bell'
  | 'radar-ping'
  | 'harp-arpeggio'
  | 'urgent-alarm'
  | 'bubble-pop';

export interface ToneInfo {
  id: ReminderToneId;
  name: string;
  description: string;
  tag: string;
  icon: string;
}

export interface ItemMemory {
  id: string;
  itemName: string;
  location: string;
  photo?: string;
  notes?: string;
  dateTime: string; // ISO date string
}

export interface Reminder {
  id: string;
  title: string;
  category: ReminderCategory;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm (24-hour)
  repeat: ReminderRepeat;
  notes?: string;
  completed: boolean;
  enabled: boolean;
  snoozedUntil?: string; // ISO timestamp if snoozed
  subject?: string; // For multi-subject study reminders
  tone?: ReminderToneId; // Custom alert tone for website reminder notification
}

export type NavTab = 'home' | 'items' | 'reminders' | 'ai' | 'settings';

export type FeedbackType = 'feature' | 'reminder_suggestion' | 'general' | 'bug';

export interface SuggestionFeedbackItem {
  id: string;
  type: FeedbackType;
  title: string;
  description: string;
  authorName?: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'implemented';
}

export type Language = 'en' | 'hi' | 'mr' | 'gu' | 'bn' | 'es';

export interface LanguageOption {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  speechLocale: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', speechLocale: 'en-US' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', speechLocale: 'hi-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳', speechLocale: 'mr-IN' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳', speechLocale: 'gu-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳', speechLocale: 'bn-IN' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', speechLocale: 'es-ES' },
];

export interface ExtractedItem {
  itemName: string;
  location: string;
  notes?: string;
}

export interface ExtractedReminder {
  title: string;
  category: ReminderCategory;
  date: string;
  time: string;
  repeat: ReminderRepeat;
  notes?: string;
  tone?: ReminderToneId;
  isAmbiguous?: boolean;
  clarificationQuestion?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  suggestedAction?: {
    type: 'view_item' | 'view_reminder';
    targetId: string;
  };
}
