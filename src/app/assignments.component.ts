import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icons.component';
import { AssignmentStatus, CalendarEvent, ScheduleService, formatDate, formatTime, todayKey, validDate, validTime } from './schedule.service';

@Component({
  selector: 'app-assignments', standalone: true,
  imports: [FormsModule, RouterLink, IconComponent],
  template: `
    <div class="page-header calendar-page-header"><div><div class="eyebrow">YOUR COURSEWORK</div><h1>Assignment Tracker</h1><p>Add deadlines, update progress, and see assignments in your calendar.</p></div><button class="calendar-primary" (click)="add()">+ Add assignment</button></div>
    <div class="shift-summary">
      <div class="surface-card shift-stat"><span>Assignments</span><strong>{{store.assignments().length}}</strong><small>Total saved</small></div>
      <div class="surface-card shift-stat"><span>Still to complete</span><strong>{{store.openAssignments().length}}</strong><small>Not started or in progress</small></div>
    </div>
    @if (message) { <div class="shift-feedback" role="status">{{message}}</div> }
    <section class="surface-card section-card"><div class="card-heading"><div><h3>Your assignments</h3><p>Keep every course deadline in one place.</p></div><span class="item-count">{{store.assignments().length}} total</span></div>
      <div class="section-items">
        @for (item of store.assignments(); track item.id) {
          <article class="shift-entry"><div class="item-icon violet"><app-icon name="assignment" /></div>
            <div class="item-copy"><strong [class.completed]="item.status === 'Completed'">{{item.title}}</strong><small>{{item.course}} · {{dateLabel(item.date)}} at {{timeLabel(item.start)}}</small>
              @if (item.notes){<span class="shift-notes">{{item.notes}}</span>}
            </div>
            <div class="entry-controls"><label class="sr-only" [attr.for]="'status-'+item.id">Assignment progress</label><select [id]="'status-'+item.id" class="compact-select" [ngModel]="item.status" (ngModelChange)="store.setAssignmentStatus(item.id, $event)">
              <option value="Not started">Not started</option><option value="In progress">In progress</option><option value="Completed">Completed</option>
            </select><button type="button" class="calendar-outline" (click)="edit(item)">Edit</button><button type="button" class="calendar-danger" (click)="remove(item)">Delete</button></div>
          </article>
        } @empty { <div class="shift-empty"><app-icon name="assignment" /><h3>No assignments yet</h3><p>Start by adding coursework and a due date.</p><button class="calendar-primary" (click)="add()">Add assignment</button></div> }
      </div>
    </section>
    @if (formOpen){
      <div class="calendar-modal-backdrop"><div class="calendar-dialog" role="dialog" aria-modal="true" aria-labelledby="assign-form-heading">
        <div class="calendar-dialog-head"><div><div class="eyebrow">ASSIGNMENT DETAILS</div><h2 id="assign-form-heading">{{editingId ? 'Edit assignment' : 'New assignment'}}</h2></div><button class="calendar-close" type="button" (click)="close()" aria-label="Close">×</button></div>
        <form class="calendar-form" (ngSubmit)="save()">
          <div class="calendar-field"><label for="a-title">Title *</label><input id="a-title" name="title" [(ngModel)]="draft.title" maxlength="100" required placeholder="e.g., Database project" /></div>
          <div class="calendar-field"><label for="a-course">Course *</label><input id="a-course" name="course" [(ngModel)]="draft.course" maxlength="80" required placeholder="e.g., INFO 5103" /></div>
          <div class="calendar-form-grid"><div class="calendar-field"><label for="a-date">Due date *</label><input id="a-date" type="date" name="date" [(ngModel)]="draft.date" required /></div><div class="calendar-field"><label for="a-time">Due time *</label><input id="a-time" type="time" name="start" [(ngModel)]="draft.start" required /></div></div>
          <div class="calendar-field"><label for="a-status">Progress</label><select id="a-status" name="status" [(ngModel)]="draft.status"><option value="Not started">Not started</option><option value="In progress">In progress</option><option value="Completed">Completed</option></select></div>
          <div class="calendar-field"><label for="a-notes">Notes</label><textarea id="a-notes" name="notes" [(ngModel)]="draft.notes" rows="2" maxlength="500"></textarea></div>
          @if (error){<p class="calendar-form-error" role="alert">{{error}}</p>}
          <div class="calendar-form-footer"><span class="calendar-form-spacer"></span><button class="calendar-outline" type="button" (click)="close()">Cancel</button><button class="calendar-primary" type="submit">{{editingId ? 'Save changes' : 'Add assignment'}}</button></div>
        </form>
      </div></div>
    }
  `
})
export class AssignmentsComponent {
  formOpen = false;
  editingId: string | null = null;
  draft: CalendarEvent = this.blank();
  error = ''; message = '';
  constructor(public readonly store: ScheduleService) {}
  private blank(): CalendarEvent { return { id: '', type: 'assignment', title: '', date: todayKey(), start: '23:59', end: '', course: '', status: 'Not started', notes: '' }; }
  dateLabel = formatDate;
  timeLabel = formatTime;
  add(): void { this.editingId = null; this.draft = this.blank(); this.error = ''; this.formOpen = true; }
  edit(item: CalendarEvent): void { this.editingId = item.id; this.draft = { ...item }; this.error = ''; this.formOpen = true; }
  close(): void { this.formOpen = false; this.error = ''; }
  save(): void {
    if (!this.draft.title.trim() || !this.draft.course.trim() || !validDate(this.draft.date) || !validTime(this.draft.start)) { this.error = 'Enter a title, course, valid date and due time.'; return; }
    const updated = !!this.editingId;
    this.store.upsert({ ...this.draft, id: this.editingId ?? this.store.newId(), type: 'assignment', title: this.draft.title.trim(), course: this.draft.course.trim(), notes: this.draft.notes.trim(), end: '' });
    this.close(); this.message = updated ? 'Assignment updated.' : 'Assignment added to your calendar.';
  }
  remove(item: CalendarEvent): void { if (!window.confirm(`Delete assignment “${item.title}”?`)) return; this.store.delete(item.id); this.message = 'Assignment deleted.'; }
}
