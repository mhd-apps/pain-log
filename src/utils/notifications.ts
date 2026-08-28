export const REMINDER_HOUR = 21

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  return Notification.requestPermission()
}

export function maybeShowEveningReminder(todayKey: string, lastPromptDate: string | undefined): boolean {
  if (!notificationsSupported()) return false
  if (Notification.permission !== 'granted') return false
  if (lastPromptDate === todayKey) return false
  if (new Date().getHours() < REMINDER_HOUR) return false

  new Notification('痛み日誌', {
    body: '今日の記録をふりかえってみませんか？',
    icon: '/icons/icon-192.png',
  })
  return true
}
