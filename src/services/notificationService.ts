import { Reminder, ReminderToneId } from '../types';
import { storage } from './storage';
import { playTone, unlockAudioContext, AVAILABLE_TONES } from './toneService';

export type ActiveAlertCallback = (reminder: Reminder) => void;
let alertSubscribers: Set<ActiveAlertCallback> = new Set();
let checkedRemindersThisMinute = new Set<string>();

export function onActiveAlert(cb: ActiveAlertCallback) {
  alertSubscribers.add(cb);
  return () => alertSubscribers.delete(cb);
}

// Play tone considering user's sound enabled setting and volume
export function playReminderTone(target?: ReminderToneId | Reminder) {
  if (!storage.isSoundEnabled()) return;

  const volume = storage.getVolume();
  let toneId: ReminderToneId = storage.getDefaultTone();

  if (typeof target === 'string') {
    toneId = target;
  } else if (target && typeof target === 'object' && target.tone) {
    toneId = target.tone;
  }

  playTone(toneId, volume);
}

export function playChime() {
  playReminderTone(storage.getDefaultTone());
}

export { unlockAudioContext, AVAILABLE_TONES };

export const notificationService = {
  isSupported(): boolean {
    return 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (!this.isSupported()) return 'denied';
    return Notification.permission;
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  },

  showNotification(reminder: Reminder) {
    // Play reminder tone
    playReminderTone(reminder);

    // Alert in-app subscribers
    alertSubscribers.forEach((cb) => {
      try {
        cb(reminder);
      } catch (err) {
        console.error(err);
      }
    });

    // Browser Notification
    if (this.isSupported() && Notification.permission === 'granted') {
      try {
        const notif = new Notification(`🔔 REMINDME AI: ${reminder.title}`, {
          body: `It's time for your ${reminder.category} reminder.\n${reminder.notes || ''}`.trim(),
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: `remindme-${reminder.id}`,
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (err) {
        console.warn('Could not display system notification:', err);
      }
    }
  },

  // Reminder check engine
  startTicker() {
    const checkDueReminders = () => {
      const now = new Date();
      const currentHours = String(now.getHours()).padStart(2, '0');
      const currentMins = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHours}:${currentMins}`;
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const dayOfWeek = now.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
      const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

      const reminders = storage.getReminders();

      reminders.forEach((r) => {
        if (!r.enabled || r.completed) return;

        // Check snoozed
        if (r.snoozedUntil) {
          const snoozeTimestamp = new Date(r.snoozedUntil).getTime();
          if (Date.now() >= snoozeTimestamp) {
            // Trigger snoozed reminder
            storage.saveReminder({ ...r, snoozedUntil: undefined });
            this.showNotification(r);
            return;
          }
        }

        // Check scheduled time
        const key = `${r.id}-${todayStr}-${currentTimeStr}`;
        if (checkedRemindersThisMinute.has(key)) return;

        if (r.time === currentTimeStr) {
          let shouldTrigger = false;
          if (r.repeat === 'daily') shouldTrigger = true;
          else if (r.repeat === 'weekdays' && isWeekday) shouldTrigger = true;
          else if (r.repeat === 'weekly') {
            // Match same day of week as reminder date
            const remDate = new Date(r.date);
            if (remDate.getDay() === dayOfWeek) shouldTrigger = true;
          } else if (r.date === todayStr) {
            shouldTrigger = true;
          }

          if (shouldTrigger) {
            checkedRemindersThisMinute.add(key);
            this.showNotification(r);
          }
        }
      });

      // Clear cache older than 100 entries
      if (checkedRemindersThisMinute.size > 100) {
        checkedRemindersThisMinute.clear();
      }
    };

    // Run immediately and every 15 seconds
    checkDueReminders();
    const interval = setInterval(checkDueReminders, 15000);
    return () => clearInterval(interval);
  },
};

export const playNotificationChime = playChime;

export function initNotifications(): NotificationPermission {
  return notificationService.getPermission();
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return notificationService.requestPermission();
}

export function showReminderNotification(reminder: Reminder) {
  notificationService.showNotification(reminder);
}

