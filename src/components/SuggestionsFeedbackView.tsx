import React, { useState } from 'react';
import {
  MessageSquare,
  Sparkles,
  Send,
  CheckCircle,
  Lightbulb,
  AlertCircle,
  HelpCircle,
  ThumbsUp,
  Clock,
} from 'lucide-react';
import { Language, FeedbackType, SuggestionFeedbackItem } from '../types';
import { storage } from '../services/storage';

interface SuggestionsFeedbackViewProps {
  language: Language;
}

export const SuggestionsFeedbackView: React.FC<SuggestionsFeedbackViewProps> = ({ language }) => {
  const [feedbackList, setFeedbackList] = useState<SuggestionFeedbackItem[]>(() => {
    try {
      const saved = localStorage.getItem('remindme_ai_feedback_v1');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'fb-1',
        type: 'feature',
        title: 'Dark mode preference in settings',
        description: 'Would love a full dark mode toggle for evening usage.',
        authorName: 'Community User',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        status: 'reviewed',
      },
      {
        id: 'fb-2',
        type: 'reminder_suggestion',
        title: 'Weekly water plant reminder preset',
        description: 'Add a preset for watering indoor plants every Sunday.',
        authorName: 'Gardening Enthusiast',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'implemented',
      },
    ];
  });

  const [type, setType] = useState<FeedbackType>('feature');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const newItem: SuggestionFeedbackItem = {
      id: `fb-${Date.now()}`,
      type,
      title: title.trim(),
      description: description.trim(),
      authorName: authorName.trim() || 'Anonymous User',
      createdAt: new Date().toISOString(),
      status: 'pending',
    };

    const updated = [newItem, ...feedbackList];
    setFeedbackList(updated);
    try {
      localStorage.setItem('remindme_ai_feedback_v1', JSON.stringify(updated));
    } catch {}

    setTitle('');
    setDescription('');
    setAuthorName('');
    setSubmittedMessage(true);
    setTimeout(() => setSubmittedMessage(false), 4000);
  };

  const getTypeLabel = (t: FeedbackType) => {
    switch (t) {
      case 'feature':
        return '✨ Feature Suggestion';
      case 'reminder_suggestion':
        return '⏰ Reminder Idea';
      case 'bug':
        return '🐞 Bug Report';
      default:
        return '💬 General Feedback';
    }
  };

  const getStatusBadge = (status: SuggestionFeedbackItem['status']) => {
    switch (status) {
      case 'implemented':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">✓ Implemented</span>;
      case 'reviewed':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">👁 Reviewed</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">⏳ Under Review</span>;
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-md mx-auto animate-in fade-in">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-5 text-white shadow-md space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h2 className="text-base font-bold">Suggestions &amp; Feedback Portal</h2>
            <p className="text-xs text-blue-100">
              Direct content creation is locked. Share your ideas and feedback with the team!
            </p>
          </div>
        </div>
      </div>

      {/* Submission Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Submit Your Suggestion or Feedback</span>
        </h3>

        {submittedMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Thank you! Your suggestion has been recorded and submitted successfully.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Feedback Category</label>
            <select
              id="select-feedback-type"
              value={type}
              onChange={(e) => setType(e.target.value as FeedbackType)}
              className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            >
              <option value="feature">✨ Feature Suggestion</option>
              <option value="reminder_suggestion">⏰ Reminder Schedule Idea</option>
              <option value="general">💬 General Feedback / Praise</option>
              <option value="bug">🐞 Issue / Bug Report</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Subject / Title</label>
            <input
              id="input-feedback-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Add export to PDF option"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Details &amp; Description</label>
            <textarea
              id="textarea-feedback-desc"
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your suggestion or feedback in detail..."
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Your Name (Optional)</label>
            <input
              id="input-feedback-author"
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <button
            id="btn-submit-feedback"
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Submit Feedback &amp; Suggestions</span>
          </button>
        </form>
      </div>

      {/* Community Suggestions & Feedback Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span>Recent Suggestions &amp; Community Feedback ({feedbackList.length})</span>
        </h3>

        <div className="space-y-3">
          {feedbackList.map((item) => (
            <div key={item.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                  {getTypeLabel(item.type)}
                </span>
                {getStatusBadge(item.status)}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-900">{item.title}</h4>
                <p className="text-xs text-slate-600 mt-1">{item.description}</p>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                <span>By {item.authorName || 'Anonymous'}</span>
                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
