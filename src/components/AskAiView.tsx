import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Mic, Sparkles, User, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { ItemMemory, Reminder, Language } from '../types';
import { translations } from '../i18n/translations';
import { aiService } from '../services/aiService';
import { useVoiceInput } from '../hooks/useVoiceInput';

interface AskAiViewProps {
  items: ItemMemory[];
  reminders: Reminder[];
  language: Language;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AskAiView: React.FC<AskAiViewProps> = ({
  items,
  reminders,
  language,
}) => {
  const t = translations[language];
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message once or when language resets
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          sender: 'ai',
          text: `${t.appTitle} AI: ${t.aiResponseIntro}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [language, messages.length, t]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice hook
  const { isListening, toggleListening, isSupported } = useVoiceInput({
    language,
    onResult: (transcript) => {
      setInputText(transcript);
    },
  });

  const suggestedQuestions = t.suggestedQuestions || [
    'Where did I keep my certificate?',
    'What reminders do I have today?',
  ];

  const handleSend = async (questionToSend?: string) => {
    const q = (questionToSend || inputText).trim();
    if (!q || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const answer = await aiService.askAi(q, items, reminders);
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        sender: 'ai',
        text: t.notFoundItem,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'welcome-msg',
        sender: 'ai',
        text: `${t.appTitle} AI: ${t.aiResponseIntro}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-145px)] max-w-md mx-auto">
      {/* Top Title Bar */}
      <div className="flex items-center justify-between py-1 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 leading-tight">
              {t.askAiBtn}
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>{t.privacy1}</span>
            </div>
          </div>
        </div>

        {messages.length > 1 && (
          <button
            onClick={handleClearHistory}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            title={t.clearAll}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-2 ${
              msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-indigo-100 text-indigo-700'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`max-w-[82%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-xs'
                  : 'bg-white border border-slate-200 text-slate-900 shadow-2xs rounded-tl-xs'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <span
                className={`text-[10px] block mt-1 ${
                  msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-xs p-3 shadow-2xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse delay-100" />
                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse delay-200" />
                <span className="ml-1 text-[11px]">{t.searching}</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {messages.length <= 2 && (
        <div className="py-2 space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {t.examplesTitle}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-700 text-slate-700 px-2.5 py-1 rounded-xl border border-slate-200 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form with Voice Button */}
      <div className="pt-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative bg-white rounded-2xl border border-slate-300 shadow-sm p-1.5 flex items-center gap-1.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all"
        >
          <input
            id="input-ask-ai"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.aiChatPlaceholder}
            className="flex-1 text-sm bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 px-2 py-1.5"
          />

          {/* Voice input */}
          <button
            type="button"
            id="btn-voice-chat"
            onClick={toggleListening}
            disabled={!isSupported}
            className={`p-2 rounded-xl transition-all ${
              isListening
                ? 'bg-rose-500 text-white animate-pulse shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            title={isListening ? t.voiceListening : t.voiceSpeakHint}
          >
            <Mic className="w-4 h-4" />
          </button>

          {/* Send */}
          <button
            type="submit"
            id="btn-send-chat"
            disabled={!inputText.trim() || isLoading}
            className="p-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 active:scale-95 disabled:opacity-40 transition-all"
            title={t.send}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {isListening && (
          <div className="flex items-center gap-2 px-2 pt-1 text-xs text-rose-600 font-semibold animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>{t.voiceListening}</span>
          </div>
        )}
      </div>
    </div>
  );
};
