import { ExtractedItem, ExtractedReminder, ItemMemory, Reminder, ReminderCategory } from '../types';

export const aiService = {
  /**
   * Parse natural language for remembering where an item was kept
   */
  async parseItem(text: string): Promise<ExtractedItem> {
    try {
      const res = await fetch('/api/gemini/parse-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      return {
        itemName: data.itemName || '',
        location: data.location || '',
        notes: data.notes || '',
      };
    } catch (err) {
      console.warn('aiService.parseItem client fallback:', err);
      // Local client fallback
      return clientParseItemFallback(text);
    }
  },

  /**
   * Parse natural language for creating a reminder
   */
  async parseReminder(text: string): Promise<ExtractedReminder> {
    try {
      const res = await fetch('/api/gemini/parse-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      return {
        title: data.title || 'Reminder',
        category: data.category || 'Other',
        date: data.date || new Date().toISOString().split('T')[0],
        time: data.time || '19:00',
        repeat: data.repeat || 'once',
        notes: data.notes || '',
        isAmbiguous: data.isAmbiguous || false,
        clarificationQuestion: data.clarificationQuestion || '',
      };
    } catch (err) {
      console.warn('aiService.parseReminder client fallback:', err);
      return clientParseReminderFallback(text);
    }
  },

  /**
   * Analyze captured or uploaded photo to identify object
   */
  async analyzePhoto(imageBase64: string, mimeType: string = 'image/jpeg'): Promise<{
    itemName: string;
    description: string;
    visibleLocationHint: string;
  }> {
    try {
      const res = await fetch('/api/gemini/analyze-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.warn('aiService.analyzePhoto fallback:', err);
      return {
        itemName: 'Captured Object',
        description: 'Photo attached',
        visibleLocationHint: '',
      };
    }
  },

  /**
   * Ask RemindMe AI questions strictly grounded in saved data
   */
  async ask(
    question: string,
    items: ItemMemory[],
    reminders: Reminder[],
    language: 'en' | 'hi' = 'en'
  ): Promise<string> {
    try {
      const res = await fetch('/api/gemini/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, items, reminders, language }),
      });

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const data = await res.json();
      return data.answer || (language === 'hi' ? 'कोई रिकॉर्ड नहीं मिला।' : 'No record found.');
    } catch (err) {
      console.warn('aiService.ask fallback:', err);
      return fallbackAnswer(question, items, reminders, language);
    }
  },

  async askAi(
    question: string,
    items: ItemMemory[],
    reminders: Reminder[],
    language: 'en' | 'hi' = 'en'
  ): Promise<string> {
    return this.ask(question, items, reminders, language);
  },
};

// Client heuristics in case server/offline
function clientParseItemFallback(text: string): ExtractedItem {
  const clean = text.trim();
  const match = clean.match(/(?:kept|put|placed|stored|left)?\s*(?:my|the)?\s*([^,.]+?)\s+(?:in|on|at|inside)\s+(?:the|my)?\s*(.+)/i);
  if (match) {
    return {
      itemName: match[1].replace(/^(?:i\s+(?:have\s+)?(?:kept|put|placed|stored|left)\s+(?:my|the)?)/i, '').trim(),
      location: match[2].trim(),
      notes: '',
    };
  }
  return {
    itemName: clean,
    location: '',
    notes: '',
  };
}

function clientParseReminderFallback(text: string): ExtractedReminder {
  const lower = text.toLowerCase();
  let category: ReminderCategory = 'Other';
  if (lower.includes('med') || lower.includes('pill') || lower.includes('dawa')) category = 'Medicine';
  else if (lower.includes('study') || lower.includes('read') || lower.includes('math') || lower.includes('science')) category = 'Study';
  else if (lower.includes('clean') || lower.includes('water') || lower.includes('house')) category = 'Household';
  else if (lower.includes('buy') || lower.includes('shop')) category = 'Shopping';

  let time = '19:00';
  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (timeMatch) {
    let h = parseInt(timeMatch[1], 10);
    const m = timeMatch[2] || '00';
    if (timeMatch[3] === 'pm' && h < 12) h += 12;
    if (timeMatch[3] === 'am' && h === 12) h = 0;
    time = `${h.toString().padStart(2, '0')}:${m}`;
  }

  return {
    title: text.replace(/^(remind me to|remind me|i have to)/i, '').trim() || 'Reminder',
    category: category as any,
    date: new Date().toISOString().split('T')[0],
    time,
    repeat: lower.includes('every') || lower.includes('daily') ? 'daily' : 'once',
    notes: '',
    isAmbiguous: !timeMatch,
  };
}

function fallbackAnswer(
  q: string,
  items: ItemMemory[],
  reminders: Reminder[],
  lang: 'en' | 'hi'
): string {
  const query = q.toLowerCase();
  const matched = items.find((i) =>
    i.itemName.toLowerCase().includes(query) ||
    query.includes(i.itemName.toLowerCase())
  );

  if (matched) {
    return lang === 'hi'
      ? `"${matched.itemName}" यहाँ रखा गया है: 📍 ${matched.location}`
      : `You kept your "${matched.itemName}" at: 📍 ${matched.location}`;
  }

  if (query.includes('today') || query.includes('reminder')) {
    const today = new Date().toISOString().split('T')[0];
    const todays = reminders.filter((r) => r.enabled && (r.date === today || r.repeat === 'daily'));
    if (todays.length > 0) {
      const list = todays.map((r) => `• ${r.time} — ${r.title}`).join('\n');
      return lang === 'hi' ? `आज के रिमाइंडर्स:\n${list}` : `Today's reminders:\n${list}`;
    }
    return lang === 'hi' ? 'आज के लिए कोई रिमाइंडर नहीं है।' : 'No reminders scheduled for today.';
  }

  return lang === 'hi'
    ? 'मेरे पास अभी इस वस्तु के लिए कोई सहेजा गया स्थान नहीं है।'
    : "I don't have a saved location for this item yet.";
}
