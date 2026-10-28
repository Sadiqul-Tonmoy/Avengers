import { Injectable, computed, signal } from '@angular/core';

export type EventType = 'class' | 'assignment' | 'work' | 'campus';
export type AssignmentStatus = 'Not started' | 'In progress' | 'Completed';
export type Priority = 'High' | 'Medium' | 'Low';
export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // Local YYYY-MM-DD
  start: string; // 24 hour HH:mm
  end: string; // Empty for assignment deadline
  course: string;
  status: AssignmentStatus;
  notes: string;
  location?: string;
  category?: string;
  rsvp?: boolean;
}
export interface TodoTask { id: string; title: string; date: string; priority: Priority; done: boolean; notes: string; }
export interface ReminderSettings { assignments: boolean; shifts: boolean; campus: boolean; }
export interface ShiftClassConflict {
  id: string; date: string; shift: CalendarEvent; courseClass: CalendarEvent;
  overlapStart: string; overlapEnd: string;
}
export function todayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function formatTime(value: string): string {
  if (!validTime(value)) return '—';
  const [hours, minutes] = value.split(':').map(Number);
  return `${hours % 12 || 12}:${String(minutes).padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
}
export function formatRange(start: string, end: string): string { return `${formatTime(start)} – ${formatTime(end)}`; }
export function formatDate(date: string): string {
  if (!validDate(date)) return date;
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}
export function validDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() + 1 === month && parsed.getDate() === day;
}
export function validTime(value: string): boolean { return /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }
export function eventTimestamp(event: CalendarEvent): number {
  const [y, m, d] = event.date.split('-').map(Number);
  const [h, minutes] = event.start.split(':').map(Number);
  return new Date(y, m - 1, d, h, minutes).getTime();
}
export function detectShiftClassConflicts(events: readonly CalendarEvent[]): ShiftClassConflict[] {
  const valid = (item: CalendarEvent): boolean => validDate(item.date) && validTime(item.start) && validTime(item.end) && item.start < item.end;
  const shifts = events.filter(item => item.type === 'work' && valid(item));
  const classes = events.filter(item => item.type === 'class' && valid(item));
  const found: ShiftClassConflict[] = [];
  for (const shift of shifts) {
    for (const courseClass of classes) {
      // Intervals are [start,end): exactly back-to-back events do not conflict.
      if (shift.date !== courseClass.date || shift.start >= courseClass.end || courseClass.start >= shift.end) continue;
      found.push({ id: `${shift.id}:${courseClass.id}`, date: shift.date, shift, courseClass,
        overlapStart: shift.start > courseClass.start ? shift.start : courseClass.start,
        overlapEnd: shift.end < courseClass.end ? shift.end : courseClass.end });
    }
  }
  return found.sort((a, b) => a.date.localeCompare(b.date) || a.overlapStart.localeCompare(b.overlapStart));
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  // Keep earlier key so data saved in the original Calendar/Phase 3 still works.
  private readonly eventsKey = 'campusflow_calendar_v1';
  private readonly tasksKey = 'campusflow_tasks_v1';
  private readonly settingsKey = 'campusflow_reminders_v1';
  readonly storageWarning = signal('');
  readonly events = signal<CalendarEvent[]>(this.loadEvents());
  readonly tasks = signal<TodoTask[]>(this.loadTasks());
  readonly reminderSettings = signal<ReminderSettings>(this.loadSettings());

  readonly classes = computed(() => this.events().filter(e => e.type === 'class'));
  readonly shifts = computed(() => this.events().filter(e => e.type === 'work').sort(byDate));
  readonly assignments = computed(() => this.events().filter(e => e.type === 'assignment').sort(byDate));
  readonly campusEvents = computed(() => this.events().filter(e => e.type === 'campus').sort(byDate));
  readonly calendarEvents = computed(() => this.events().filter(e => e.type !== 'campus' || e.rsvp !== false));
  readonly conflicts = computed(() => detectShiftClassConflicts(this.events()));
  readonly openAssignments = computed(() => this.assignments().filter(e => e.status !== 'Completed'));
  readonly sortedTasks = computed(() => [...this.tasks()].sort((a, b) => Number(a.done) - Number(b.done) ||
    a.date.localeCompare(b.date) || priorityValue(a.priority) - priorityValue(b.priority)));

  upsert(event: CalendarEvent): void {
    const all = this.events();
    this.events.set(all.some(item => item.id === event.id)
      ? all.map(item => item.id === event.id ? { ...event } : item)
      : [...all, { ...event }]);
    this.save(this.eventsKey, this.events());
  }
  delete(id: string): void { this.events.update(all => all.filter(item => item.id !== id)); this.save(this.eventsKey, this.events()); }
  setAssignmentStatus(id: string, status: AssignmentStatus): void {
    const event = this.events().find(item => item.id === id && item.type === 'assignment');
    if (event) this.upsert({ ...event, status });
  }
  setRsvp(id: string, rsvp: boolean): void {
    const event = this.events().find(item => item.id === id && item.type === 'campus');
    if (event) this.upsert({ ...event, rsvp });
  }
  upsertTask(task: TodoTask): void {
    this.tasks.update(all => all.some(t => t.id === task.id) ? all.map(t => t.id === task.id ? { ...task } : t) : [...all, { ...task }]);
    this.save(this.tasksKey, this.tasks());
  }
  toggleTask(id: string): void {
    this.tasks.update(all => all.map(task => task.id === id ? { ...task, done: !task.done } : task));
    this.save(this.tasksKey, this.tasks());
  }
  deleteTask(id: string): void { this.tasks.update(all => all.filter(t => t.id !== id)); this.save(this.tasksKey, this.tasks()); }
  toggleReminder(key: keyof ReminderSettings): void {
    this.reminderSettings.update(settings => ({ ...settings, [key]: !settings[key] }));
    this.save(this.settingsKey, this.reminderSettings());
  }
  conflictsForShift(draft: CalendarEvent): ShiftClassConflict[] {
    return detectShiftClassConflicts([...this.events().filter(e => e.id !== draft.id && e.type === 'class'), draft]);
  }
  loadExampleData(): void {
    // Opt-in sample: safe not to overwrite an existing planner.
    if (this.events().length || this.tasks().length) return;
    const key = (days: number): string => {
      const date = new Date(); date.setDate(date.getDate() + days);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    const base = { course: '', status: 'Not started' as AssignmentStatus, notes: '' };
    this.upsert({ ...base, id: this.newId(), type: 'class', title: 'Software Engineering', date: key(1), start: '10:00', end: '11:00' });
    this.upsert({ ...base, id: this.newId(), type: 'work', title: 'Evening café shift', date: key(1), start: '10:30', end: '12:00', notes: 'Example overlapping shift' });
    this.upsert({ ...base, id: this.newId(), type: 'assignment', title: 'Sprint backlog submission', date: key(3), start: '23:59', end: '', course: 'INFO 5103' });
    this.upsert({ ...base, id: this.newId(), type: 'campus', title: 'Campus career workshop', date: key(4), start: '13:00', end: '14:30', category: 'Career', location: 'Student Centre', rsvp: false });
    this.upsertTask({ id: this.newId(), title: 'Review lecture slides', date: key(0), priority: 'High', done: false, notes: '' });
  }
  newId(): string {
    return `cf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
  private loadEvents(): CalendarEvent[] {
    try {
      const items: unknown = JSON.parse(localStorage.getItem(this.eventsKey) || '[]');
      if (!Array.isArray(items)) throw new Error('Not an array');
      const types: EventType[] = ['class', 'assignment', 'work', 'campus'];
      return items.filter((item): item is CalendarEvent => {
        if (!item || typeof item !== 'object') return false;
        const e = item as Partial<CalendarEvent>;
        return typeof e.id === 'string' && typeof e.title === 'string' && types.includes(e.type as EventType)
          && typeof e.date === 'string' && typeof e.start === 'string' && typeof e.end === 'string'
          && typeof e.course === 'string' && typeof e.status === 'string' && typeof e.notes === 'string';
      });
    } catch { this.storageWarning.set('Unable to read saved schedule. Check browser storage settings.'); return []; }
  }
  private loadTasks(): TodoTask[] {
    try {
      const data: unknown = JSON.parse(localStorage.getItem(this.tasksKey) || '[]');
      if (!Array.isArray(data)) return [];
      return data.filter((t): t is TodoTask => !!t && typeof t.id === 'string' && typeof t.title === 'string'
        && typeof t.date === 'string' && validDate(t.date) && ['High', 'Medium', 'Low'].includes(t.priority)
        && typeof t.done === 'boolean' && typeof t.notes === 'string');
    } catch { return []; }
  }
  private loadSettings(): ReminderSettings {
    const defaultSettings: ReminderSettings = { assignments: true, shifts: true, campus: false };
    try {
      const value: unknown = JSON.parse(localStorage.getItem(this.settingsKey) || 'null');
      if (!value || typeof value !== 'object') return defaultSettings;
      const val = value as Partial<ReminderSettings>;
      return { assignments: typeof val.assignments === 'boolean' ? val.assignments : true,
        shifts: typeof val.shifts === 'boolean' ? val.shifts : true,
        campus: typeof val.campus === 'boolean' ? val.campus : false };
    } catch { return defaultSettings; }
  }
  private save(key: string, value: unknown): void {
    try { localStorage.setItem(key, JSON.stringify(value)); this.storageWarning.set(''); }
    catch { this.storageWarning.set('Browser storage is unavailable. Changes may be lost after refreshing.'); }
  }
}
function byDate(a: CalendarEvent, b: CalendarEvent): number { return a.date.localeCompare(b.date) || a.start.localeCompare(b.start); }
function priorityValue(p: Priority): number { return p === 'High' ? 0 : p === 'Medium' ? 1 : 2; }
