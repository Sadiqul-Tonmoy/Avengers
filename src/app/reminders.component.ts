import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icons.component';
import { CalendarEvent, EventType, ReminderSettings, ScheduleService, eventTimestamp, formatDate, formatTime } from './schedule.service';

@Component({
 selector:'app-reminders',standalone:true,imports:[RouterLink,IconComponent],
 template:`
 <div class="page-header"><div><div class="eyebrow">STAY ON TRACK</div><h1>Reminders</h1><p>Choose which commitments appear in your upcoming reminder list.</p></div></div>
 <section class="surface-card section-card"><div class="card-heading"><div><h3>Reminder preferences</h3><p>Your settings are saved in this browser.</p></div></div>
 <div class="section-items">
 @for (opt of options;track opt.key){<div class="section-item"><div class="item-icon" [class]="'item-icon '+opt.tone"><app-icon [name]="opt.icon" /></div><div class="item-copy"><strong>{{opt.label}}</strong><small>{{opt.detail}}</small></div><button type="button" role="switch" class="toggle-switch" [class.on]="isEnabled(opt.key)" [attr.aria-checked]="isEnabled(opt.key)" [attr.aria-label]="opt.label" (click)="store.toggleReminder(opt.key)"><span></span></button></div>}
 </div></section>
 <section class="surface-card section-card task-section"><div class="card-heading"><div><h3>Coming up within 7 days</h3><p>In-app reminders for deadlines, shifts and RSVPed events.</p></div><span class="item-count">{{upcoming.length}} upcoming</span></div><div class="section-items">
 @for (event of upcoming;track event.id){<div class="shift-entry"><div class="item-icon" [class]="event.type==='assignment'?'item-icon violet':event.type==='work'?'item-icon amber':'item-icon teal'"><app-icon [name]="event.type==='assignment'?'assignment':event.type==='work'?'briefcase':'events'"/></div><div class="item-copy"><strong>{{event.title}}</strong><small>{{dateLabel(event.date)}} at {{timeLabel(event.start)}}</small><span class="shift-notes">{{event.type==='assignment'?'Assignment deadline':event.type==='work'?'Part-time work shift':'Campus event'}}</span></div><span class="status-pill blue">Upcoming</span></div>}
 @empty {<div class="mini-empty">Nothing to remind you about in the next seven days with your current settings.</div>}
 </div></section>
 <p class="muted-disclaimer">Reminders are shown inside CampusFlow when you open this page. This version does not send push notifications or emails.</p>
 `
})
export class RemindersComponent {
 options:{key:keyof ReminderSettings;label:string;detail:string;icon:string;tone:string}[]=[
  {key:'assignments',label:'Assignment deadlines',detail:'Keep track of upcoming unfinished assignments',icon:'assignment',tone:'violet'},
  {key:'shifts',label:'Work shifts',detail:'See reminders for upcoming part-time shifts',icon:'briefcase',tone:'amber'},
  {key:'campus',label:'Campus events',detail:'Include activities you have RSVPed to',icon:'events',tone:'teal'}
 ];
 constructor(public readonly store:ScheduleService){}
 isEnabled(key:keyof ReminderSettings):boolean{return this.store.reminderSettings()[key];}
 get upcoming():CalendarEvent[]{
  const settings=this.store.reminderSettings();const now=Date.now();const end=now+7*24*60*60*1000;
  return this.store.events().filter(event=>{
   const kind:EventType=event.type;
   if(kind==='class')return false;
   if(kind==='assignment'&&(!settings.assignments||event.status==='Completed'))return false;
   if(kind==='work'&&!settings.shifts)return false;
   if(kind==='campus'&&(!settings.campus||event.rsvp===false))return false;
   const time=eventTimestamp(event);return time>=now&&time<=end;
  }).sort((a,b)=>eventTimestamp(a)-eventTimestamp(b));
 }
 dateLabel=formatDate;timeLabel=formatTime;
}
