import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icons.component';
import { CalendarEvent, ScheduleService, ShiftClassConflict, formatDate, formatRange, validDate, validTime } from './schedule.service';

@Component({
  selector: 'app-work-shifts',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    <div class="page-header calendar-page-header">
      <div><div class="eyebrow">PART-TIME WORK</div><h1>Work Shifts</h1>
        <p>Add, update and delete shifts. Your work schedule stays in sync with the calendar.</p></div>
      <button type="button" class="calendar-primary" (click)="startNew()">+ Add work shift</button>
    </div>

    <div class="shift-summary">
      <div class="surface-card shift-stat"><span>Saved shifts</span><strong>{{ store.shifts().length }}</strong><small>On your calendar</small></div>
      <div class="surface-card shift-stat" [class.shift-stat-danger]="store.conflicts().length">
        <span>Class / shift overlaps</span><strong>{{ store.conflicts().length }}</strong><small>{{ store.conflicts().length ? 'Needs your attention' : 'No conflicts found' }}</small>
      </div>
    </div>

    @if (message) { <div class="shift-feedback" role="status">{{ message }}</div> }
    @if (store.storageWarning()) { <p class="calendar-storage-warning" role="alert">{{ store.storageWarning() }}</p> }

    @if (store.conflicts().length) {
      <section class="shift-alert-banner" role="alert">
        <app-icon name="alert" />
        <div><strong>{{ store.conflicts().length }} class / shift {{ store.conflicts().length === 1 ? 'conflict' : 'conflicts' }} detected</strong>
          <p>These shifts overlap a scheduled class. You can save a shift with a conflict, but it will remain flagged until the times change.</p>
          <a routerLink="/conflict-alerts">View conflict details →</a>
        </div>
      </section>
    }

    <section class="surface-card section-card">
      <div class="card-heading"><div><h3>Your work schedule</h3><p>Tap Edit to change a shift or Delete to remove it.</p></div><span class="item-count">{{ store.shifts().length }} shifts</span></div>
      <div class="section-items">
        @for (shift of store.shifts(); track shift.id) {
          <article class="shift-entry" [class.shift-entry-conflict]="hasConflict(shift.id)">
            <div class="item-icon amber"><app-icon name="briefcase" /></div>
            <div class="item-copy">
              <strong>{{ shift.title }}</strong>
              <small>{{ displayDate(shift.date) }} · {{ displayRange(shift.start, shift.end) }}</small>
              @if (shift.notes) { <span class="shift-notes">{{ shift.notes }}</span> }
              @if (hasConflict(shift.id)) { <span class="shift-inline-alert"><app-icon name="alert" /> Overlaps with a class</span> }
            </div>
            <div class="shift-actions">
              <button type="button" class="calendar-outline" (click)="edit(shift)">Edit</button>
              <button type="button" class="calendar-danger" (click)="remove(shift)">Delete</button>
            </div>
          </article>
        } @empty {
          <div class="shift-empty"><app-icon name="briefcase" /><h3>No shifts added yet</h3><p>Start by adding your first part-time work shift. It will appear in the Unified Calendar automatically.</p>
            <button type="button" class="calendar-primary" (click)="startNew()">Add first shift</button>
          </div>
        }
      </div>
    </section>
    <div class="info-panel"><app-icon name="calendar" /><span>All shifts are shown in your <a routerLink="/calendar">Unified Calendar</a>. Add your classes there to enable overlap detection.</span></div>

    @if (formVisible) {
      <div class="calendar-modal-backdrop">
        <div class="calendar-dialog" role="dialog" aria-modal="true" aria-labelledby="shift-dialog-title">
          <div class="calendar-dialog-head"><div><div class="eyebrow">WORK SCHEDULE</div><h2 id="shift-dialog-title">{{ editingId ? 'Edit work shift' : 'Add work shift' }}</h2></div>
            <button type="button" class="calendar-close" (click)="cancel()" aria-label="Close form">×</button>
          </div>
          <form class="calendar-form" (ngSubmit)="save()">
            <div class="calendar-field"><label for="shift-title">Shift name / workplace <span>*</span></label>
              <input id="shift-title" name="title" required maxlength="100" [(ngModel)]="form.title" placeholder="e.g., Evening shift at café" /></div>
            <div class="calendar-form-grid">
              <div class="calendar-field"><label for="shift-date">Date <span>*</span></label><input id="shift-date" type="date" name="date" required [(ngModel)]="form.date" /></div>
              <div class="calendar-field"><label for="shift-start">Start time <span>*</span></label><input id="shift-start" type="time" name="start" required [(ngModel)]="form.start" /></div>
              <div class="calendar-field"><label for="shift-end">End time <span>*</span></label><input id="shift-end" type="time" name="end" required [(ngModel)]="form.end" /></div>
            </div>
            <div class="calendar-field"><label for="shift-notes">Location or notes (optional)</label>
              <textarea id="shift-notes" name="notes" [(ngModel)]="form.notes" maxlength="500" rows="2" placeholder="Store location, manager, notes..."></textarea></div>
            @if (draftConflicts.length) {
              <div class="shift-draft-warning" role="alert"><app-icon name="alert" /><div><strong>Warning: This shift overlaps {{ draftConflicts.length }} {{ draftConflicts.length === 1 ? 'class' : 'classes' }}.</strong>
                @for (conflict of draftConflicts; track conflict.id) { <p>{{ conflict.courseClass.title }} · {{ displayRange(conflict.overlapStart, conflict.overlapEnd) }}</p> }
                <small>You can save this shift, but CampusFlow will flag the conflict.</small>
              </div></div>
            }
            @if (formError) { <p class="calendar-form-error" role="alert">{{ formError }}</p> }
            <div class="calendar-form-footer"><span class="calendar-form-spacer"></span>
              <button type="button" class="calendar-outline" (click)="cancel()">Cancel</button>
              <button type="submit" class="calendar-primary">{{ editingId ? 'Save changes' : 'Add shift' }}</button>
            </div>
          </form>
        </div>
      </div>
    }
  `
})
export class WorkShiftsComponent {
  formVisible = false;
  editingId: string | null = null;
  form: CalendarEvent = this.blank();
  formError = '';
  message = '';

  constructor(public readonly store: ScheduleService) {}

  private blank(): CalendarEvent {
    const today = new Date();
    const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return { id: '', type: 'work', title: '', date, start: '17:00', end: '21:00', course: '', status: 'Not started', notes: '' };
  }

  displayDate(value: string): string { return formatDate(value); }
  displayRange(start: string, end: string): string { return formatRange(start, end); }
  hasConflict(id: string): boolean { return this.store.conflicts().some(conflict => conflict.shift.id === id); }

  get draftConflicts(): ShiftClassConflict[] {
    return validDate(this.form.date) && validTime(this.form.start) && validTime(this.form.end) && this.form.start < this.form.end
      ? this.store.conflictsForShift({ ...this.form, id: this.editingId ?? '__draft_shift__' }) : [];
  }

  startNew(): void {
    this.editingId = null;
    this.form = this.blank();
    this.formError = '';
    this.message = '';
    this.formVisible = true;
  }

  edit(shift: CalendarEvent): void {
    this.editingId = shift.id;
    this.form = { ...shift };
    this.formError = '';
    this.message = '';
    this.formVisible = true;
  }

  cancel(): void { this.formVisible = false; this.formError = ''; }

  save(): void {
    const title = this.form.title.trim();
    if (!title || !validDate(this.form.date) || !validTime(this.form.start) || !validTime(this.form.end)) {
      this.formError = 'Please enter a shift name, valid date, start time and end time.';
      return;
    }
    if (this.form.end <= this.form.start) {
      this.formError = 'End time must be after start time. Overnight shifts are not supported in this version.';
      return;
    }
    const edited = !!this.editingId;
    const shift: CalendarEvent = { ...this.form, type: 'work', id: this.editingId ?? this.store.newId(), title, notes: this.form.notes.trim(), course: '' };
    this.store.upsert(shift);
    this.formVisible = false;
    this.editingId = null;
    this.formError = '';
    const conflicts = this.store.conflicts().filter(item => item.shift.id === shift.id).length;
    this.message = `${edited ? 'Shift updated' : 'Shift added'} successfully.${conflicts ? ` Warning: this shift overlaps ${conflicts} ${conflicts === 1 ? 'class' : 'classes'}.` : ''}`;
  }

  remove(shift: CalendarEvent): void {
    if (!window.confirm(`Delete “${shift.title}” on ${formatDate(shift.date)}?`)) return;
    this.store.delete(shift.id);
    this.message = 'Shift deleted. Calendar and conflict alerts updated.';
  }
}
