import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icons.component';
import { CalendarEvent, ScheduleService, formatDate, formatRange, todayKey, validDate, validTime } from './schedule.service';

@Component({
 selector:'app-campus-events', standalone:true, imports:[FormsModule,RouterLink,IconComponent],
 template:`
 <div class="page-header calendar-page-header"><div><div class="eyebrow">EXPLORE CAMPUS</div><h1>Campus Events</h1><p>Browse activities, filter by type, and RSVP to add them to your calendar.</p></div><button class="calendar-primary" (click)="add()">+ Add campus event</button></div>
 <section class="surface-card section-card">
 <div class="card-heading"><div><h3>Upcoming & saved events</h3><p>Events appear in your calendar when you RSVP.</p></div><label class="event-filter-label">Type <select class="compact-select" [(ngModel)]="filter" aria-label="Filter events by type"><option value="All">All</option>@for (c of categories;track c){<option [value]="c">{{c}}</option>}</select></label></div>
 <div class="section-items">
 @for (event of filtered;track event.id){<article class="shift-entry"><div class="item-icon teal"><app-icon name="events" /></div><div class="item-copy"><strong>{{event.title}}</strong><small>{{event.category || 'General'}} · {{dateLabel(event.date)}} · {{timeLabel(event.start,event.end)}}</small><span class="shift-notes">{{event.location || 'Location not specified'}} @if (event.notes){ · {{event.notes}} }</span></div><div class="entry-controls"><button type="button" [class]="event.rsvp === false ? 'calendar-primary' : 'calendar-outline'" (click)="store.setRsvp(event.id,event.rsvp === false)">{{event.rsvp === false ? 'RSVP' : 'Going ✓'}}</button><button class="calendar-outline" type="button" (click)="edit(event)">Edit</button><button type="button" class="calendar-danger" (click)="remove(event)">Delete</button></div></article>}
 @empty {<div class="shift-empty"><app-icon name="events" /><h3>No events found</h3><p>Add a campus activity or choose another category.</p><button class="calendar-primary" (click)="add()">Add event</button></div>}
 </div></section>
 @if (formOpen){<div class="calendar-modal-backdrop"><div class="calendar-dialog" role="dialog" aria-modal="true" aria-labelledby="campus-form-title">
  <div class="calendar-dialog-head"><div><div class="eyebrow">CAMPUS ACTIVITY</div><h2 id="campus-form-title">{{editingId ? 'Edit campus event' : 'Add campus event'}}</h2></div><button class="calendar-close" type="button" (click)="close()" aria-label="Close">×</button></div>
  <form class="calendar-form" (ngSubmit)="save()">
   <div class="calendar-field"><label for="ce-title">Event name *</label><input id="ce-title" name="title" [(ngModel)]="draft.title" maxlength="100" required placeholder="e.g., Career fair" /></div>
   <div class="calendar-form-grid"><div class="calendar-field"><label for="ce-category">Type</label><select id="ce-category" name="category" [(ngModel)]="draft.category">@for (c of categories;track c){<option [value]="c">{{c}}</option>}</select></div><div class="calendar-field"><label for="ce-location">Location *</label><input id="ce-location" name="location" [(ngModel)]="draft.location" maxlength="100" required placeholder="e.g., Student Centre" /></div>
   <div class="calendar-field"><label for="ce-date">Date *</label><input id="ce-date" type="date" name="date" [(ngModel)]="draft.date" required /></div><div class="calendar-field"><label for="ce-start">Start time *</label><input id="ce-start" type="time" name="start" [(ngModel)]="draft.start" required /></div><div class="calendar-field"><label for="ce-end">End time *</label><input id="ce-end" type="time" name="end" [(ngModel)]="draft.end" required /></div></div>
   <div class="calendar-field"><label for="ce-notes">Details</label><textarea id="ce-notes" name="notes" [(ngModel)]="draft.notes" maxlength="500" rows="2"></textarea></div>
   <label class="simple-checkbox"><input type="checkbox" name="rsvp" [(ngModel)]="draft.rsvp" /> Add to my calendar (RSVP)</label>
   @if (error){<p class="calendar-form-error" role="alert">{{error}}</p>}
   <div class="calendar-form-footer"><span class="calendar-form-spacer"></span><button type="button" class="calendar-outline" (click)="close()">Cancel</button><button type="submit" class="calendar-primary">{{editingId ? 'Save changes' : 'Add event'}}</button></div>
  </form>
 </div></div>}
 `
})
export class CampusEventsComponent {
 categories = ['Workshop', 'Social', 'Academic', 'Sports', 'Career', 'Technology', 'Other'];
 filter = 'All'; formOpen = false; editingId: string | null = null; error = '';
 draft: CalendarEvent = this.blank();
 constructor(public readonly store: ScheduleService) {}
 dateLabel = formatDate; timeLabel = formatRange;
 get filtered(): CalendarEvent[] { return this.store.campusEvents().filter(e => this.filter === 'All' || (e.category || 'Other') === this.filter); }
 private blank(): CalendarEvent {return {id:'',type:'campus',title:'',date:todayKey(),start:'12:00',end:'13:00',course:'',status:'Not started',notes:'',location:'',category:'Workshop',rsvp:false};}
 add():void {this.editingId=null;this.draft=this.blank();this.error='';this.formOpen=true;}
 edit(event:CalendarEvent):void {this.editingId=event.id;this.draft={...event,category:event.category || 'Other',location:event.location || '',rsvp:event.rsvp !== false};this.error='';this.formOpen=true;}
 close():void {this.formOpen=false;this.error='';}
 save():void {
  if(!this.draft.title.trim() || !this.draft.location?.trim() || !validDate(this.draft.date) || !validTime(this.draft.start) || !validTime(this.draft.end)) {this.error='Enter a title, location, valid date, start and end time.';return;}
  if(this.draft.end <= this.draft.start){this.error='End time must be after the start time.';return;}
  this.store.upsert({...this.draft,id:this.editingId ?? this.store.newId(),type:'campus',title:this.draft.title.trim(),location:this.draft.location.trim(),notes:this.draft.notes.trim()});
  this.close();
 }
 remove(event:CalendarEvent):void {if(window.confirm(`Delete “${event.title}”?`))this.store.delete(event.id);}
}
