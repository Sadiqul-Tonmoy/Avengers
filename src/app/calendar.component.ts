import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icons.component';
import { CalendarEvent, EventType, ScheduleService, ShiftClassConflict, detectShiftClassConflicts, formatDate, formatRange, validDate, validTime } from './schedule.service';

interface CalendarDay {
  date: string;
  shortLabel: string;
  number: string;
  events: CalendarEvent[];
  isToday: boolean;
}

function asLocalDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function localDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    <div class="page-header calendar-page-header">
      <div>
        <div class="eyebrow">ALL COMMITMENTS, ONE VIEW</div>
        <h1>Unified Calendar</h1>
        <p>Manage your classes, assignments, work shifts, and campus events in one place.</p>
      </div>
      <button type="button" class="calendar-primary" (click)="openAdd()">+ Add event</button>
    </div>

    <section class="surface-card calendar-card">
      <div class="calendar-head calendar-live-head">
        <div>
          <h3>{{ weekTitle }}</h3>
          <p>{{ events.length }} saved {{ events.length === 1 ? 'commitment' : 'commitments' }} · Stored in this browser</p>
        </div>
        <div class="calendar-controls">
          <button type="button" class="calendar-outline" (click)="goToday()">Today</button>
          <button type="button" class="calendar-arrow" (click)="changeWeek(-1)" aria-label="Previous week">‹</button>
          <button type="button" class="calendar-arrow" (click)="changeWeek(1)" aria-label="Next week">›</button>
          <div class="segmented" role="group" aria-label="Calendar view">
            <button type="button" [class.selected]="view === 'week'" (click)="view = 'week'" [attr.aria-pressed]="view === 'week'">Week</button>
            <button type="button" [class.selected]="view === 'day'" (click)="view = 'day'" [attr.aria-pressed]="view === 'day'">Day</button>
          </div>
        </div>
      </div>

      <div class="calendar-key">
        <span><i class="legend-dot legend-blue"></i>Class</span>
        <span><i class="legend-dot legend-purple"></i>Assignment</span>
        <span><i class="legend-dot legend-orange"></i>Work</span>
        <span><i class="legend-dot legend-teal"></i>Campus event</span>
      </div>

      @if (view === 'week') {
        <div class="calendar-week calendar-editable-week">
          @for (day of days; track day.date) {
            <div class="day-column" [class.calendar-today]="day.isToday">
              <button type="button" class="day-heading calendar-day-heading" (click)="selectDay(day.date)" [attr.aria-label]="'Show ' + day.date + ' day view'">
                <strong>{{ day.shortLabel }}</strong><span>{{ day.number }}</span>
              </button>
              <div class="day-events">
                @for (event of day.events; track event.id) {
                  <button type="button" class="event-pill calendar-event-button" [class.assignment]="event.type === 'assignment'" [class.work]="event.type === 'work'" [class.campus]="event.type === 'campus'" (click)="openEdit(event)" [attr.aria-label]="'Edit ' + event.title">
                    <small>{{ eventTime(event) }}</small><strong>{{ event.title }}</strong>
                  </button>
                } @empty {
                  <div class="empty-day">No events</div>
                }
              </div>
              <button type="button" class="calendar-add-small" (click)="openAdd(day.date)" [attr.aria-label]="'Add event on ' + day.date">+ Add</button>
            </div>
          }
        </div>
      } @else {
        <div class="calendar-day-picker">
          <label for="selected-calendar-day">Select a day</label>
          <input id="selected-calendar-day" type="date" [ngModel]="selectedDate" (ngModelChange)="selectDay($event)" />
        </div>
        <div class="single-day calendar-live-day">
          <div class="calendar-day-title"><h4>{{ selectedDayLabel }}</h4><button type="button" class="calendar-outline" (click)="openAdd(selectedDate)">+ Add event</button></div>
          @for (event of eventsForDate(selectedDate); track event.id) {
            <div class="single-event">
              <span class="event-mark" [class.assignment]="event.type === 'assignment'" [class.work]="event.type === 'work'" [class.campus]="event.type === 'campus'"></span>
              <div class="calendar-event-description"><strong>{{ event.title }}</strong><small>{{ categoryLabel(event.type) }} · {{ eventTime(event) }} @if (event.course) { · {{ event.course }} } @if (event.type === 'assignment') { · {{ event.status }} }</small></div>
              <button type="button" class="calendar-outline" (click)="openEdit(event)">Edit</button>
            </div>
          } @empty {
            <div class="calendar-empty-state">Nothing scheduled for this day. Add your first class, assignment, shift, or campus event.</div>
          }
        </div>
      }
    </section>

    @if (weekConflicts.length) {
      <div class="info-panel calendar-conflict-panel">
        <app-icon name="alert" />
        <div><strong>Class / work-shift conflicts this week</strong>
          @for (conflict of weekConflicts; track conflict) { <p>{{ conflict }}</p> }
        </div>
      </div>
    } @else {
      <div class="info-panel"><app-icon name="alert" /><span><strong>No class / shift overlaps this week.</strong> Conflict alerts automatically update when you add or edit classes or shifts. <a routerLink="/conflict-alerts">View alerts page →</a></span></div>
    }

    @if (storageWarning) { <p class="calendar-storage-warning" role="alert">{{ storageWarning }}</p> }

    @if (formVisible) {
      <div class="calendar-modal-backdrop">
        <div class="calendar-dialog" role="dialog" aria-modal="true" aria-labelledby="event-dialog-heading">
          <div class="calendar-dialog-head">
            <div><div class="eyebrow">CAMPUSFLOW PLANNER</div><h2 id="event-dialog-heading">{{ editingId ? 'Edit commitment' : 'Add a commitment' }}</h2></div>
            <button class="calendar-close" type="button" (click)="closeForm()" aria-label="Close form">×</button>
          </div>
          <form (ngSubmit)="saveEvent()" class="calendar-form">
            <div class="calendar-field"><label for="event-title">Title <span>*</span></label><input id="event-title" name="title" [(ngModel)]="form.title" maxlength="100" required placeholder="e.g., Software Engineering lecture" /></div>
            <div class="calendar-form-grid">
              <div class="calendar-field"><label for="event-type">Category</label><select id="event-type" name="type" [(ngModel)]="form.type"><option value="class">Class</option><option value="assignment">Assignment</option><option value="work">Work shift</option><option value="campus">Campus event</option></select></div>
              <div class="calendar-field"><label for="event-date">Date <span>*</span></label><input id="event-date" name="date" type="date" [(ngModel)]="form.date" required /></div>
              <div class="calendar-field"><label for="event-start">{{ form.type === 'assignment' ? 'Due time' : 'Start time' }} <span>*</span></label><input id="event-start" name="start" type="time" [(ngModel)]="form.start" required /></div>
              @if (form.type !== 'assignment') {
                <div class="calendar-field"><label for="event-end">End time <span>*</span></label><input id="event-end" name="end" type="time" [(ngModel)]="form.end" required /></div>
              }
            </div>
            @if (form.type === 'assignment') {
              <div class="calendar-form-grid">
                <div class="calendar-field"><label for="event-course">Course <span>*</span></label><input id="event-course" name="course" [(ngModel)]="form.course" maxlength="80" required placeholder="e.g., INFO 5103" /></div>
                <div class="calendar-field"><label for="event-status">Progress</label><select id="event-status" name="status" [(ngModel)]="form.status"><option value="Not started">Not started</option><option value="In progress">In progress</option><option value="Completed">Completed</option></select></div>
              </div>
            }
            <div class="calendar-field"><label for="event-notes">Notes (optional)</label><textarea id="event-notes" name="notes" [(ngModel)]="form.notes" maxlength="500" rows="2" placeholder="Room, location, or other details"></textarea></div>
            @if (draftShiftConflicts.length) {
              <div class="shift-draft-warning" role="alert"><app-icon name="alert" /><div>
                <strong>Warning: this {{ form.type === 'class' ? 'class' : 'work shift' }} overlaps another scheduled commitment.</strong>
                @for (conflict of draftShiftConflicts; track conflict.id) {
                  <p>{{ conflict.courseClass.title }} and {{ conflict.shift.title }} · {{ formatOverlap(conflict.overlapStart, conflict.overlapEnd) }}</p>
                }
                <small>You can save this event, but CampusFlow will keep the conflict alert visible.</small>
              </div></div>
            }
            @if (formError) { <p class="calendar-form-error" role="alert">{{ formError }}</p> }
            <div class="calendar-form-footer">
              @if (editingId) { <button type="button" class="calendar-danger" (click)="deleteEvent()">Delete</button> }
              <span class="calendar-form-spacer"></span>
              <button type="button" class="calendar-outline" (click)="closeForm()">Cancel</button>
              <button type="submit" class="calendar-primary">{{ editingId ? 'Save changes' : 'Add event' }}</button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class CalendarComponent {
  get events(): CalendarEvent[] { return this.schedule.calendarEvents(); }
  view: 'week' | 'day' = 'week';
  selectedDate = localDateKey(new Date());
  formVisible = false;
  editingId: string | null = null;
  form: CalendarEvent = this.blankEvent(this.selectedDate);
  formError = '';
  get storageWarning(): string { return this.schedule.storageWarning(); }

  constructor(public readonly schedule: ScheduleService) {}

  private blankEvent(date: string): CalendarEvent {
    return { id: '', title: '', type: 'class', date, start: '09:00', end: '10:00', course: '', status: 'Not started', notes: '' };
  }

  get days(): CalendarDay[] {
    const monday = asLocalDate(this.selectedDate);
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, offset) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + offset);
      const key = localDateKey(date);
      return { date: key, shortLabel: date.toLocaleDateString('en-CA', { weekday: 'short' }).toUpperCase(), number: String(date.getDate()), events: this.eventsForDate(key), isToday: key === localDateKey(new Date()) };
    });
  }

  get weekTitle(): string {
    const days = this.days;
    const first = asLocalDate(days[0].date);
    const last = asLocalDate(days[6].date);
    const firstLabel = first.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });
    const lastLabel = last.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${firstLabel} – ${lastLabel}`;
  }

  get selectedDayLabel(): string {
    return asLocalDate(this.selectedDate).toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  }

  get weekConflicts(): string[] {
    const dates = new Set(this.days.map(day => day.date));
    return this.schedule.conflicts()
      .filter(conflict => dates.has(conflict.date))
      .map(conflict => `${conflict.courseClass.title} overlaps ${conflict.shift.title} on ${formatDate(conflict.date)} (${formatRange(conflict.overlapStart, conflict.overlapEnd)}).`);
  }

  get draftShiftConflicts(): ShiftClassConflict[] {
    if (this.form.type !== 'class' && this.form.type !== 'work') return [];
    if (!validDate(this.form.date) || !validTime(this.form.start) || !validTime(this.form.end) || this.form.end <= this.form.start) return [];
    const draft = { ...this.form, id: this.editingId ?? '__draft_calendar_event__' };
    return detectShiftClassConflicts([...this.events.filter(event => event.id !== draft.id), draft])
      .filter(conflict => conflict.shift.id === draft.id || conflict.courseClass.id === draft.id);
  }

  formatOverlap(start: string, end: string): string { return formatRange(start, end); }

  eventsForDate(date: string): CalendarEvent[] {
    return this.events.filter(event => event.date === date).sort((a, b) => a.start.localeCompare(b.start));
  }

  changeWeek(offset: number): void {
    const date = asLocalDate(this.selectedDate);
    date.setDate(date.getDate() + offset * 7);
    this.selectedDate = localDateKey(date);
  }

  selectDay(date: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    this.selectedDate = date;
    this.view = 'day';
  }

  goToday(): void { this.selectedDate = localDateKey(new Date()); }

  openAdd(date = this.selectedDate): void {
    this.editingId = null;
    this.form = this.blankEvent(date);
    this.formError = '';
    this.formVisible = true;
  }

  openEdit(event: CalendarEvent): void {
    this.editingId = event.id;
    this.form = { ...event };
    this.formError = '';
    this.formVisible = true;
  }

  closeForm(): void { this.formVisible = false; this.formError = ''; }

  saveEvent(): void {
    const title = this.form.title.trim();
    const course = this.form.course.trim();
    if (!title || !validDate(this.form.date) || !validTime(this.form.start)) {
      this.formError = 'Please enter a title, valid date, and start/due time.';
      return;
    }
    if (this.form.type === 'assignment' && !course) {
      this.formError = 'Please enter the course for this assignment.';
      return;
    }
    if (this.form.type !== 'assignment' && (!validTime(this.form.end) || this.form.end <= this.form.start)) {
      this.formError = 'End time must be later than start time. Overnight shifts are not supported yet.';
      return;
    }
    const nextEvent: CalendarEvent = {
      ...this.form, title, course, notes: this.form.notes.trim(),
      id: this.editingId ?? this.schedule.newId(),
      rsvp: this.form.type === 'campus' ? true : this.form.rsvp,
      end: this.form.type === 'assignment' ? '' : this.form.end
    };
    this.schedule.upsert(nextEvent);
    this.selectedDate = nextEvent.date;
    this.closeForm();
  }

  deleteEvent(): void {
    if (!this.editingId || !window.confirm('Delete this event?')) return;
    this.schedule.delete(this.editingId);
    this.closeForm();
  }

  categoryLabel(type: EventType): string {
    return { class: 'Class', assignment: 'Assignment', work: 'Work shift', campus: 'Campus event' }[type];
  }

  eventTime(event: CalendarEvent): string {
    const start = this.timeLabel(event.start);
    return event.type === 'assignment' ? `Due ${start}` : `${start}–${this.timeLabel(event.end)}`;
  }

  private timeLabel(value: string): string {
    const [hourText, minute] = value.split(':');
    const hour = Number(hourText);
    return `${hour % 12 || 12}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
  }

}
