import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatTime(time: string): string {
  return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getDayName(dayNumber: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayNumber];
}

export function calculateAttendanceStatus(
  scanTime: string,
  scheduleStartTime: string,
  gracePeriodMinutes: number
): 'on_time' | 'late' | 'absent' {
  const scan = new Date(`2000-01-01T${scanTime}`);
  const start = new Date(`2000-01-01T${scheduleStartTime}`);
  const graceEnd = new Date(start.getTime() + gracePeriodMinutes * 60000);

  if (scan <= graceEnd) {
    return 'on_time';
  } else {
    return 'late';
  }
}