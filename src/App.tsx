import React, { useState, useEffect, useCallback } from 'react';
import { NavTab, Language, ItemMemory, Reminder, ReminderCategory, ReminderRepeat, ReminderToneId } from './types';
import { storageService, getTodayDateString } from './services/storage';
import {
  initNotifications,
  requestNotificationPermission,
  showReminderNotification,
  playNotificationChime,
  unlockAudioContext,
} from './services/notificationService';

// Components
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { FindItemView } from './components/FindItemView';
import { AllItemsView } from './components/AllItemsView';
import { RemindersView } from './components/RemindersView';
import { AskAiView } from './components/AskAiView';
import { SettingsView } from './components/SettingsView';
import { RememberItemModal } from './components/RememberItemModal';
import { CreateReminderModal } from './components/CreateReminderModal';
import { NaturalLanguageReminderModal } from './components/NaturalLanguageReminderModal';
import { ActiveReminderAlert } from './components/ActiveReminderAlert';
import { InWebsiteReminderBanner } from './components/InWebsiteReminderBanner';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  // 1. Language state
  const [language, setLanguage] = useState<Language>(() => storageService.getLanguage());

  // 2. Navigation state
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [isFindViewActive, setIsFindViewActive] = useState(false);

  // 3. Storage state
  const [items, setItems] = useState<ItemMemory[]>(() => storageService.getItems());
  const [reminders, setReminders] = useState<Reminder[]>(() => storageService.getReminders());

  // 4. Modals state
  const [isRememberModalOpen, setIsRememberModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemMemory | null>(null);

  const [isCreateReminderModalOpen, setIsCreateReminderModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [initialReminderCategory, setInitialReminderCategory] = useState<ReminderCategory | undefined>();

  const [isNaturalAiReminderModalOpen, setIsNaturalAiReminderModalOpen] = useState(false);

  // 5. Active Trigger Alert & In-Website Banner state
  const [activeAlertReminder, setActiveAlertReminder] = useState<Reminder | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [triggeredReminderIds, setTriggeredReminderIds] = useState<Set<string>>(new Set());

  // Auto-unlock Web Audio API on first user gesture anywhere in page
  useEffect(() => {
    const handleFirstGesture = () => {
      unlockAudioContext();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);
    window.addEventListener('touchstart', handleFirstGesture);
    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
      window.removeEventListener('touchstart', handleFirstGesture);
    };
  }, []);

  // 6. Notification permission
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    setNotificationPermission(initNotifications());
  }, []);

  const handleRequestNotification = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      playNotificationChime();
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    storageService.setLanguage(lang);
  };

  // -------------------------------------------------------------
  // Reminder Trigger Engine (Checks every 10 seconds)
  // -------------------------------------------------------------
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const todayStr = getTodayDateString();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;
      const dayOfWeek = now.getDay();
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

      const currentReminders = storageService.getReminders();

      for (const r of currentReminders) {
        if (!r.enabled || r.completed) continue;

        // Check if snoozed
        if (r.snoozedUntil) {
          const snoozeTime = new Date(r.snoozedUntil).getTime();
          if (now.getTime() < snoozeTime) {
            continue; // still snoozing
          }
        }

        // Check date condition
        let isDateMatch = false;
        if (r.repeat === 'daily') isDateMatch = true;
        else if (r.repeat === 'weekdays' && isWeekday) isDateMatch = true;
        else if (r.repeat === 'weekly') {
          const originalDate = new Date(r.date);
          if (originalDate.getDay() === dayOfWeek) isDateMatch = true;
        } else {
          isDateMatch = r.date === todayStr;
        }

        if (isDateMatch && r.time === currentTimeStr) {
          // Trigger if not triggered recently in this session
          const triggerKey = `${r.id}-${todayStr}-${currentTimeStr}`;
          if (!triggeredReminderIds.has(triggerKey)) {
            setTriggeredReminderIds((prev) => new Set(prev).add(triggerKey));
            setActiveAlertReminder(r);
            setIsAlertModalOpen(false);
            showReminderNotification(r);
            break;
          }
        }
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 10000);
    return () => clearInterval(interval);
  }, [triggeredReminderIds]);

  // Test trigger for in-website reminder notification and tone audition
  const handleTestReminderAlert = () => {
    unlockAudioContext();
    const defaultTone = storageService.getDefaultTone();
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const testReminder: Reminder = {
      id: `test-${Date.now()}`,
      title: 'Water indoor plants & check garden',
      category: 'Household',
      date: getTodayDateString(),
      time: `${hours}:${mins}`,
      repeat: 'once',
      notes: 'Testing in-website notification alert with selected musical tone!',
      completed: false,
      enabled: true,
      tone: defaultTone,
    };
    setActiveAlertReminder(testReminder);
    setIsAlertModalOpen(false);
    showReminderNotification(testReminder);
  };

  // -------------------------------------------------------------
  // Item Operations
  // -------------------------------------------------------------
  const handleSaveItem = (itemData: {
    itemName: string;
    location: string;
    photo?: string;
    notes?: string;
    id?: string;
  }) => {
    if (itemData.id) {
      const updated = storageService.updateItem(itemData.id, {
        itemName: itemData.itemName,
        location: itemData.location,
        photo: itemData.photo,
        notes: itemData.notes,
        dateTime: new Date().toISOString(),
      });
      if (updated) {
        setItems(storageService.getItems());
      }
    } else {
      storageService.addItem({
        itemName: itemData.itemName,
        location: itemData.location,
        photo: itemData.photo,
        notes: itemData.notes,
      });
      setItems(storageService.getItems());
    }
    setEditingItem(null);
  };

  const handleDeleteItem = (id: string) => {
    storageService.deleteItem(id);
    setItems(storageService.getItems());
  };

  const handleEditItem = (item: ItemMemory) => {
    setEditingItem(item);
    setIsRememberModalOpen(true);
  };

  // -------------------------------------------------------------
  // Reminder Operations
  // -------------------------------------------------------------
  const handleSaveReminder = (reminderData: Omit<Reminder, 'id'> & { id?: string }) => {
    if (reminderData.id) {
      storageService.updateReminder(reminderData.id, reminderData);
    } else {
      storageService.addReminder(reminderData);
    }
    setReminders(storageService.getReminders());
    setEditingReminder(null);
  };

  const handleToggleReminderComplete = (id: string) => {
    storageService.toggleReminderComplete(id);
    setReminders(storageService.getReminders());
  };

  const handleToggleReminderEnabled = (id: string) => {
    storageService.toggleReminderEnabled(id);
    setReminders(storageService.getReminders());
  };

  const handleSnoozeReminder = (id: string, minutes: number = 15) => {
    storageService.snoozeReminder(id, minutes);
    setReminders(storageService.getReminders());
    if (activeAlertReminder && activeAlertReminder.id === id) {
      setActiveAlertReminder(null);
    }
  };

  const handleSkipRecurring = (id: string) => {
    storageService.skipRecurringReminder(id);
    setReminders(storageService.getReminders());
  };

  const handleDeleteReminder = (id: string) => {
    storageService.deleteReminder(id);
    setReminders(storageService.getReminders());
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setIsCreateReminderModalOpen(true);
  };

  const handleSwitchNaturalToEdit = (extracted: {
    title: string;
    category: ReminderCategory;
    date: string;
    time: string;
    repeat: ReminderRepeat;
    notes?: string;
    tone?: ReminderToneId;
  }) => {
    setIsNaturalAiReminderModalOpen(false);
    setEditingReminder({
      id: '',
      title: extracted.title,
      category: extracted.category,
      date: extracted.date,
      time: extracted.time,
      repeat: extracted.repeat,
      notes: extracted.notes,
      tone: extracted.tone,
      completed: false,
      enabled: true,
    });
    setIsCreateReminderModalOpen(true);
  };

  // -------------------------------------------------------------
  // Data Operations (Export, Import, Reset, Clear)
  // -------------------------------------------------------------
  const handleExportData = () => {
    const dataStr = storageService.exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `remindme-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (data: { items: ItemMemory[]; reminders: Reminder[] }) => {
    storageService.importData(data);
    setItems(storageService.getItems());
    setReminders(storageService.getReminders());
  };

  const handleResetDemoData = () => {
    storageService.resetToDemo();
    setItems(storageService.getItems());
    setReminders(storageService.getReminders());
  };

  const handleClearAllData = () => {
    storageService.clearAll();
    setItems([]);
    setReminders([]);
  };

  // Pending reminder count for badge
  const pendingCount = reminders.filter((r) => {
    if (!r.enabled || r.completed) return false;
    const todayStr = getTodayDateString();
    return r.date === todayStr || r.repeat === 'daily';
  }).length;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Header */}
      <Header
        language={language}
        onLanguageChange={handleLanguageChange}
        notificationPermission={notificationPermission}
        onRequestNotification={handleRequestNotification}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 pt-4">

        {/* VIEW: HOME */}
        {currentTab === 'home' && !isFindViewActive && (
          <HomeScreen
            items={items}
            reminders={reminders}
            language={language}
            onNavigate={(tab) => {
              setIsFindViewActive(false);
              setCurrentTab(tab);
            }}
            onOpenRememberModal={() => {
              setEditingItem(null);
              setIsRememberModalOpen(true);
            }}
            onOpenFindView={() => setIsFindViewActive(true)}
            onOpenNaturalAiModal={() => setIsNaturalAiReminderModalOpen(true)}
            onToggleReminderComplete={handleToggleReminderComplete}
            onSelectItemToView={(item) => {
              setIsFindViewActive(true);
            }}
          />
        )}

        {/* VIEW: FIND ITEM */}
        {(isFindViewActive || (currentTab === 'items' && isFindViewActive)) && (
          <FindItemView
            items={items}
            language={language}
            onOpenRememberModal={() => {
              setEditingItem(null);
              setIsRememberModalOpen(true);
            }}
            onBackToHome={() => setIsFindViewActive(false)}
            onEditItem={handleEditItem}
          />
        )}

        {/* VIEW: ALL ITEMS MEMORY */}
        {currentTab === 'items' && !isFindViewActive && (
          <AllItemsView
            items={items}
            language={language}
            onAddItem={() => {
              setEditingItem(null);
              setIsRememberModalOpen(true);
            }}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {/* VIEW: REMINDERS DASHBOARD */}
        {currentTab === 'reminders' && (
          <RemindersView
            reminders={reminders}
            language={language}
            onOpenCreateModal={(category) => {
              setEditingReminder(null);
              setInitialReminderCategory(category);
              setIsCreateReminderModalOpen(true);
            }}
            onOpenNaturalAiModal={() => setIsNaturalAiReminderModalOpen(true)}
            onToggleComplete={handleToggleReminderComplete}
            onToggleEnabled={handleToggleReminderEnabled}
            onSnooze={handleSnoozeReminder}
            onSkipRecurring={handleSkipRecurring}
            onEdit={handleEditReminder}
            onDelete={handleDeleteReminder}
          />
        )}

        {/* VIEW: ASK AI */}
        {currentTab === 'ai' && (
          <AskAiView
            items={items}
            reminders={reminders}
            language={language}
          />
        )}

        {/* VIEW: SETTINGS */}
        {currentTab === 'settings' && (
          <SettingsView
            language={language}
            onLanguageChange={handleLanguageChange}
            notificationPermission={notificationPermission}
            onRequestNotification={handleRequestNotification}
            items={items}
            reminders={reminders}
            onExportData={handleExportData}
            onImportData={handleImportData}
            onResetDemoData={handleResetDemoData}
            onClearAllData={handleClearAllData}
            onTestReminderAlert={handleTestReminderAlert}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        currentTab={isFindViewActive ? 'items' : currentTab}
        onSelectTab={(tab) => {
          setIsFindViewActive(false);
          setCurrentTab(tab);
        }}
        language={language}
        pendingRemindersCount={pendingCount}
      />

      {/* ----------------- IN-WEBSITE NOTIFICATIONS & ALERTS ----------------- */}

      {/* Floating In-Website Reminder Notification Banner */}
      <InWebsiteReminderBanner
        reminder={activeAlertReminder}
        language={language}
        onDone={(r) => {
          handleToggleReminderComplete(r.id);
          setActiveAlertReminder(null);
          setIsAlertModalOpen(false);
        }}
        onSnooze={(r, min = 15) => {
          handleSnoozeReminder(r.id, min);
          setActiveAlertReminder(null);
          setIsAlertModalOpen(false);
        }}
        onDismiss={() => {
          setActiveAlertReminder(null);
          setIsAlertModalOpen(false);
        }}
        onExpandToModal={() => setIsAlertModalOpen(true)}
      />

      {/* Full Modal Alert Dialog (Opened on expand or focus) */}
      {isAlertModalOpen && activeAlertReminder && (
        <ActiveReminderAlert
          reminder={activeAlertReminder}
          language={language}
          onDone={(r) => {
            handleToggleReminderComplete(r.id);
            setActiveAlertReminder(null);
            setIsAlertModalOpen(false);
          }}
          onSnooze={(r, min = 15) => {
            handleSnoozeReminder(r.id, min);
            setActiveAlertReminder(null);
            setIsAlertModalOpen(false);
          }}
          onDismiss={() => {
            setActiveAlertReminder(null);
            setIsAlertModalOpen(false);
          }}
        />
      )}

      {/* Remember Item Modal */}
      <RememberItemModal
        isOpen={isRememberModalOpen}
        onClose={() => setIsRememberModalOpen(false)}
        onSave={handleSaveItem}
        language={language}
        editingItem={editingItem}
      />

      {/* Create / Edit Reminder Modal */}
      <CreateReminderModal
        isOpen={isCreateReminderModalOpen}
        onClose={() => setIsCreateReminderModalOpen(false)}
        onSave={handleSaveReminder}
        language={language}
        editingReminder={editingReminder}
        initialCategory={initialReminderCategory}
      />

      {/* Natural Language AI Reminder Modal */}
      <NaturalLanguageReminderModal
        isOpen={isNaturalAiReminderModalOpen}
        onClose={() => setIsNaturalAiReminderModalOpen(false)}
        onSwitchToEdit={handleSwitchNaturalToEdit}
        language={language}
      />

      <OfflineIndicator />
    </div>
  );
}
