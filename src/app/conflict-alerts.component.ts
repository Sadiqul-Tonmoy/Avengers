import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icons.component';
import { ScheduleService, formatDate, formatRange } from './schedule.service';

@Component({
  selector: 'app-conflict-alerts',
  standalone: true,
  imports: [RouterLink, IconComponent],
  template: `
    <div class="page-header calendar-page-header">
      <div><div class="eyebrow">SPOT ISSUES EARLY</div><h1>Conflict Alerts</h1>
        <p>Automatically detect when part-time work shifts overlap scheduled classes.</p></div>
      <a class="calendar-outline shift-button-link" routerLink="/calendar">View Calendar</a>
    </div>

    <section class="surface-card section-card">
      <div class="card-heading"><div><h3>Class and work-shift conflicts</h3>
        <p>Updates automatically when you add, edit or remove a class or work shift.</p></div>
        <span class="item-count" [class.shift-conflict-count]="store.conflicts().length">{{ store.conflicts().length }} {{ store.conflicts().length === 1 ? 'alert' : 'alerts' }}</span>
      </div>

      @for (conflict of store.conflicts(); track conflict.id) {
        <article class="conflict-card" role="alert">
          <div class="conflict-card-icon"><app-icon name="alert" /></div>
          <div class="conflict-card-main">
            <strong>{{ conflict.shift.title }} overlaps {{ conflict.courseClass.title }}</strong>
            <p><app-icon name="calendar" /> {{ dateLabel(conflict.date) }}</p>
            <p><app-icon name="clock" /> Conflict: {{ rangeLabel(conflict.overlapStart, conflict.overlapEnd) }}</p>
            <div class="conflict-details">
              <span><b>Class:</b> {{ conflict.courseClass.title }} · {{ rangeLabel(conflict.courseClass.start, conflict.courseClass.end) }}</span>
              <span><b>Work shift:</b> {{ conflict.shift.title }} · {{ rangeLabel(conflict.shift.start, conflict.shift.end) }}</span>
            </div>
            <small>Adjust the class or shift time to resolve this warning.</small>
          </div>
          <a routerLink="/work-shifts" class="calendar-outline shift-button-link">Manage shifts</a>
        </article>
      } @empty {
        <div class="shift-empty conflict-clear"><app-icon name="check" /><h3>No class / shift conflicts</h3>
          <p>You're all clear! CampusFlow checks your saved classes and work shifts for overlapping times on the same day.</p>
          <div class="shift-empty-links"><a routerLink="/calendar" class="calendar-outline shift-button-link">Add a class</a>
            <a routerLink="/work-shifts" class="calendar-primary shift-button-link">Manage shifts</a></div>
        </div>
      }
    </section>
    @if (store.storageWarning()) { <p class="calendar-storage-warning" role="alert">{{ store.storageWarning() }}</p> }
    <div class="info-panel"><app-icon name="alert" /><span><strong>How detection works:</strong> A conflict appears when a class and a shift share a date and their times overlap. A shift starting exactly when a class ends is not a conflict. This version supports same-day schedules only.</span></div>
  `
})
export class ConflictAlertsComponent {
  constructor(public readonly store: ScheduleService) {}
  dateLabel(date: string): string { return formatDate(date); }
  rangeLabel(start: string, end: string): string { return formatRange(start, end); }
}
