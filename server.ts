import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Lazy Gemini client helper
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

/**
 * 1. PARSE ITEM FROM NATURAL LANGUAGE
 * e.g. "I kept my school certificate in the blue cupboard, second shelf."
 * or Hindi: "Mera passport bedroom ki red almirah mein hai"
 */
app.post('/api/gemini/parse-item', async (req: Request, res: Response) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text input is required' });
  }

  const ai = getGeminiClient();
  if (ai) {
    try {
      const prompt = `You are a memory extractor for RemindMe AI.
Extract the item name, the location where it was kept, and any optional notes from this user statement:
"${text}"

The statement might be in English, Hindi, or Hinglish (e.g. "Mera charger TV unit ke drawer mein hai").
Rules:
1. itemName: short, clean name of the object.
2. location: exact place/shelf/drawer mentioned.
3. notes: any extra descriptive detail, or empty string.
4. If location is missing, set location to empty string.
5. If itemName is missing, set itemName to empty string.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              itemName: { type: Type.STRING },
              location: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
            required: ['itemName', 'location'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.itemName) {
        return res.json({
          success: true,
          itemName: parsed.itemName,
          location: parsed.location || '',
          notes: parsed.notes || '',
        });
      }
    } catch (err: any) {
      console.warn('Gemini parse-item error, falling back to heuristic:', err?.message);
    }
  }

  // Heuristic rule-based fallback
  const fallback = parseItemHeuristic(text);
  return res.json({
    success: true,
    ...fallback,
    fallbackUsed: true,
  });
});

function parseItemHeuristic(text: string) {
  let clean = text.trim();
  let itemName = '';
  let location = '';
  let notes = '';

  // Patterns like "I kept my X in Y", "I put X in Y", "X is in Y", "X is on Y"
  const englishMatch = clean.match(/(?:kept|put|placed|stored|left)?\s*(?:my|the)?\s*([^,.]+?)\s+(?:in|on|at|inside|under|behind)\s+(?:the|my)?\s*(.+)/i);
  if (englishMatch) {
    itemName = englishMatch[1].replace(/^(?:i\s+(?:have\s+)?(?:kept|put|placed|stored|left)\s+(?:my|the)?)/i, '').trim();
    location = englishMatch[2].trim();
  } else {
    // Hindi patterns: "Mera X Y mein hai", "X ko Y me rakha hai"
    const hindiMatch = clean.match(/(?:mera|meri|mere)?\s*([^,.]+?)\s+(?:ko)?\s*(.+?)\s+(?:mein|me|par|pe)\s+(?:hai|rakha\s+hai)?/i);
    if (hindiMatch) {
      itemName = hindiMatch[1].trim();
      location = hindiMatch[2].trim();
    } else {
      itemName = clean;
      location = '';
    }
  }

  // Capitalize nicely
  if (itemName) {
    itemName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
  }
  return { itemName, location, notes };
}

/**
 * 2. PARSE REMINDER FROM NATURAL LANGUAGE
 * e.g. "Remind me tomorrow at 8 AM to take my medicine"
 * or "I have to study maths every evening at 7"
 * or "Kal shaam 7 baje maths padhne ki yaad dilana"
 */
app.post('/api/gemini/parse-reminder', async (req: Request, res: Response) => {
  const { text, userTimezone } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text input is required' });
  }

  const todayStr = new Date().toISOString().split('T')[0];
  const ai = getGeminiClient();

  if (ai) {
    try {
      const prompt = `You are a reminder extractor for RemindMe AI.
The current date is ${todayStr}. The user's input is:
"${text}"

Extract the reminder details.
Categories must be one of:
["medicine", "study", "household", "health", "work", "appointment", "birthday", "shopping", "other"]

Repeat must be one of:
["once", "daily", "weekly", "weekdays", "custom"]

Rules:
1. title: concise name of task (e.g. "Study Maths", "Take Blood Pressure Medicine", "Buy Vegetables", "Clean water filter").
2. category: pick the best matching category from the list above.
3. date: YYYY-MM-DD format. If "tomorrow", compute next day from ${todayStr}. If no specific date but recurring, use ${todayStr}. If unclear, specify ${todayStr}.
4. time: "HH:mm" in 24-hour format (e.g. "07:00", "19:00", "20:00"). If not specified or ambiguous, set isAmbiguous to true.
5. repeat: "once", "daily", "weekly", "weekdays", or "custom". If user says "every evening", "every day", use "daily". If "Monday to Friday", use "weekdays". If "every Sunday", use "weekly".
6. notes: optional notes or empty string.
7. isAmbiguous: boolean. Set to true if time or date is very unclear.
8. clarificationQuestion: if ambiguous, provide a short friendly question asking for time/date.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              category: { type: Type.STRING },
              date: { type: Type.STRING },
              time: { type: Type.STRING },
              repeat: { type: Type.STRING },
              notes: { type: Type.STRING },
              isAmbiguous: { type: Type.BOOLEAN },
              clarificationQuestion: { type: Type.STRING },
            },
            required: ['title', 'category', 'date', 'time', 'repeat', 'isAmbiguous'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.title) {
        return res.json({
          success: true,
          ...parsed,
        });
      }
    } catch (err: any) {
      console.warn('Gemini parse-reminder error, falling back to heuristic:', err?.message);
    }
  }

  // Heuristic rule-based fallback
  const fallback = parseReminderHeuristic(text, todayStr);
  return res.json({
    success: true,
    ...fallback,
    fallbackUsed: true,
  });
});

function parseReminderHeuristic(text: string, todayStr: string) {
  const lower = text.toLowerCase();
  let category = 'other';
  if (lower.includes('med') || lower.includes('pill') || lower.includes('dawa') || lower.includes('tablet')) category = 'medicine';
  else if (lower.includes('study') || lower.includes('read') || lower.includes('padh') || lower.includes('math') || lower.includes('science') || lower.includes('exam')) category = 'study';
  else if (lower.includes('clean') || lower.includes('filter') || lower.includes('house') || lower.includes('ghar') || lower.includes('wash')) category = 'household';
  else if (lower.includes('water') || lower.includes('walk') || lower.includes('workout') || lower.includes('exercise')) category = 'health';
  else if (lower.includes('buy') || lower.includes('shop') || lower.includes('market') || lower.includes('vegetable') || lower.includes('sabzi')) category = 'shopping';
  else if (lower.includes('birthday') || lower.includes('janamdin')) category = 'birthday';
  else if (lower.includes('meeting') || lower.includes('doctor') || lower.includes('dentist') || lower.includes('appointment')) category = 'appointment';
  else if (lower.includes('work') || lower.includes('office') || lower.includes('email') || lower.includes('report')) category = 'work';

  let time = '19:00';
  let isAmbiguous = false;
  // Match 7 pm, 8:30 am, 19:00, 7 baje
  const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje)?/);
  if (timeMatch) {
    let hours = parseInt(timeMatch[1], 10);
    const mins = timeMatch[2] ? timeMatch[2] : '00';
    const ampm = timeMatch[3];
    if (ampm === 'pm' && hours < 12) hours += 12;
    if (ampm === 'am' && hours === 12) hours = 0;
    if (ampm === 'baje' && (lower.includes('shaam') || lower.includes('evening') || lower.includes('raat')) && hours < 12) hours += 12;
    time = `${hours.toString().padStart(2, '0')}:${mins}`;
  } else {
    isAmbiguous = true;
  }

  let repeat = 'once';
  if (lower.includes('every day') || lower.includes('daily') || lower.includes('roz') || lower.includes('har din') || lower.includes('every evening')) repeat = 'daily';
  else if (lower.includes('weekday') || lower.includes('mon-fri') || lower.includes('monday to friday')) repeat = 'weekdays';
  else if (lower.includes('every week') || lower.includes('weekly') || lower.includes('every sunday')) repeat = 'weekly';

  let date = todayStr;
  if (lower.includes('tomorrow') || lower.includes('kal')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    date = d.toISOString().split('T')[0];
  }

  let title = text.replace(/^(remind me to|remind me|i have to|kal shaam|yaad dilana|i need to)/i, '').trim();
  if (!title) title = 'Important Reminder';
  title = title.charAt(0).toUpperCase() + title.slice(1);

  return {
    title,
    category,
    date,
    time,
    repeat,
    notes: '',
    isAmbiguous,
    clarificationQuestion: isAmbiguous ? 'At what time would you like to be reminded?' : '',
  };
}

/**
 * 3. ANALYZE PHOTO
 * Recognizes object in photo without falsely claiming to know exact physical location.
 */
app.post('/api/gemini/analyze-photo', async (req: Request, res: Response) => {
  const { imageBase64, mimeType = 'image/jpeg' } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      itemName: 'Identified Item',
      description: 'Photo attached',
      detectedLocationHint: '',
    });
  }

  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const prompt = `You are an item identifier for RemindMe AI.
Analyze this photo:
1. itemName: short, specific title of the object (e.g. "School Certificate", "TV Remote", "Phone Charger", "Car Keys", "Blue Passport Folder").
2. description: brief 1-sentence description of the visual features (color, brand, distinguishing marks).
3. visibleLocationHint: ONLY if clearly visible in the image itself (e.g. "Wooden desk", "Drawer", "Inside bookshelf"), otherwise leave completely empty. DO NOT make up any room or location.

Strict Rule: Do not pretend to know where the user kept it in their house unless it is visibly obvious in the photo.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            itemName: { type: Type.STRING },
            description: { type: Type.STRING },
            visibleLocationHint: { type: Type.STRING },
          },
          required: ['itemName', 'description'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      itemName: parsed.itemName || 'Captured Item',
      description: parsed.description || '',
      visibleLocationHint: parsed.visibleLocationHint || '',
    });
  } catch (err: any) {
    console.error('Photo analysis error:', err?.message);
    return res.json({
      itemName: 'Captured Item',
      description: 'Photo saved',
      visibleLocationHint: '',
    });
  }
});

/**
 * 4. ASK REMINDME AI
 * Question answering grounded strictly in stored items & reminders.
 */
app.post('/api/gemini/ask', async (req: Request, res: Response) => {
  const { question, items = [], reminders = [], language = 'en' } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required' });
  }

  const ai = getGeminiClient();
  const contextSummary = {
    itemsCount: items.length,
    storedItems: items.map((i: any) => ({
      id: i.id,
      itemName: i.itemName,
      location: i.location,
      notes: i.notes || '',
      recordedAt: i.dateTime,
    })),
    storedReminders: reminders.map((r: any) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      date: r.date,
      time: r.time,
      repeat: r.repeat,
      completed: r.completed,
      enabled: r.enabled,
      notes: r.notes || '',
    })),
  };

  if (!ai) {
    // Heuristic answer
    const fallbackAnswer = answerQuestionHeuristic(question, items, reminders, language);
    return res.json({ answer: fallbackAnswer, source: 'heuristic' });
  }

  try {
    const prompt = `You are the friendly, helpful AI assistant for "REMINDME AI".
Tagline: "Remember things. Remember tasks. Remember life."
Current language preference: ${language === 'hi' ? 'Hindi (हिंदी)' : 'English'}.
Today's local reference date: ${new Date().toISOString().split('T')[0]}.

CRITICAL INSTRUCTIONS & SAFETY RULES:
1. Answer personal memory and reminder questions based ONLY on the stored items and reminders provided below.
2. NEVER invent or hallucinate a location, item, reminder, dosage, or task.
3. If no matching record exists in the saved data, explicitly state:
   - In English: "I don't have a saved record for this yet."
   - In Hindi: "मेरे पास अभी इस वस्तु या रिमाइंडर का कोई रिकॉर्ड नहीं है।"
4. The app does NOT continuously track physical objects. It only knows what the user explicitly saved.
5. NEVER provide medical diagnosis, dosage recommendations, or medical advice. For medicine reminders, only reflect the exact title and time entered by the user.
6. If the user asks in Hindi or Hinglish, answer politely in natural Hindi/Hinglish.
7. Keep responses concise, clear, and direct (1-3 sentences max).

STORED DATA:
${JSON.stringify(contextSummary, null, 2)}

USER QUESTION:
"${question}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return res.json({
      answer: response.text?.trim() || "I couldn't find a record for that.",
      source: 'gemini',
    });
  } catch (err: any) {
    console.error('Ask Gemini error:', err?.message);
    const fallback = answerQuestionHeuristic(question, items, reminders, language);
    return res.json({ answer: fallback, source: 'heuristic-fallback' });
  }
});

function answerQuestionHeuristic(q: string, items: any[], reminders: any[], lang: string): string {
  const query = q.toLowerCase();

  // Search items
  const itemMatch = items.find((item: any) => {
    const name = (item.itemName || '').toLowerCase();
    return query.includes(name) || name.split(' ').some((w: string) => w.length > 2 && query.includes(w));
  });

  if (itemMatch) {
    if (lang === 'hi') {
      return `आपका "${itemMatch.itemName}" यहाँ रखा गया है: 📍 ${itemMatch.location} (रिकॉर्ड किया गया: ${new Date(itemMatch.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
    }
    return `You kept your "${itemMatch.itemName}" at: 📍 ${itemMatch.location} (Recorded on ${new Date(itemMatch.dateTime).toLocaleDateString()} at ${new Date(itemMatch.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`;
  }

  // Reminders for today / pending
  if (query.includes('today') || query.includes('aaj') || query.includes('reminder') || query.includes('task') || query.includes('pending')) {
    const today = new Date().toISOString().split('T')[0];
    const todays = reminders.filter((r: any) => r.enabled && (r.date === today || r.repeat === 'daily' || r.repeat === 'weekdays'));
    if (todays.length === 0) {
      return lang === 'hi' ? 'आज के लिए आपका कोई पेंडिंग रिमाइंडर नहीं है।' : "You have no upcoming reminders scheduled for today.";
    }
    const list = todays.map((r: any) => `• ${r.time} — ${r.title} (${r.category})`).join('\n');
    return lang === 'hi'
      ? `आज के आपके रिमाइंडर:\n${list}`
      : `Here are your reminders for today:\n${list}`;
  }

  return lang === 'hi'
    ? 'मेरे पास अभी इस वस्तु या रिमाइंडर का कोई रिकॉर्ड नहीं है।'
    : "I don't have a saved location or record for this item yet.";
}

// -------------------------------------------------------------
// Vite Middleware & Static Server
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`REMINDME AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
