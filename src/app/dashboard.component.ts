import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icons.component';
import { CalendarEvent, ScheduleService, eventTimestamp, formatDate, formatTime, todayKey } from './schedule.service';

@Component({
 selector:'app-dashboard',standalone:true,imports:[RouterLink,IconComponent],
 template:`
  <div class="page-header"><div><div class="eyebrow">YOUR STUDENT HUB</div><h1>Good to see you! <span class="wave">✳</span></h1><p>Your classes, coursework, shifts and events — all in one place.</p></div><span class="data-label">Live schedule overview</span></div>
  <section class="hero-banner"><div class="hero-content"><span class="hero-topline">STAY IN SYNC WITH YOUR WEEK</span><h2>Less juggling.<br><em>More living.</em></h2><p>Keep school, work, and campus activities together — with automatic scheduling conflict alerts.</p><a routerLink="/calendar" class="hero-cta">Open my calendar <app-icon name="arrow" /></a></div><div class="hero-visual" aria-hidden="true"><div class="float-card card-top"><span class="event-dot"></span><div><strong>Classes</strong><small>{{classCount}} this week</small></div><span>✓</span></div><div class="float-card card-mid"><span class="event-dot purple"></span><div><strong>Assignments</strong><small>{{assignmentCount}} due soon</small></div><span>⌁</span></div><div class="float-card card-low"><span class="event-dot coral"></span><div><strong>Work shifts</strong><small>{{shiftCount}} upcoming</small></div><span>↗</span></div></div></section>
  @if (store.events().length === 0 && store.tasks().length === 0) {
    <div class="starter-demo"><div><strong>New to CampusFlow?</strong><p>Start from an empty planner or load example data to demonstrate class/shift conflict detection.</p></div><button type="button" class="calendar-outline" (click)="store.loadExampleData()">Load example schedule</button></div>
  }
  <section class="metric-grid" aria-label="Schedule counts">
   @for (card of metrics; track card.title) {<a [routerLink]="card.link" class="metric-card"><div class="metric-top"><span class="metric-icon" [class]="'metric-icon '+card.tone"><app-icon [name]="card.icon"/></span><span class="metric-arr"><app-icon name="arrow"/></span></div><strong>{{card.value}}</strong><span>{{card.title}}</span><small>{{card.detail}}</small></a>}
  </section>
  <div class="dashboard-grid">
   <section class="surface-card"><div class="card-heading"><div><h3>Up next</h3><p>Your upcoming commitments</p></div><a routerLink="/calendar">See calendar <span>→</span></a></div><div class="agenda-list">
     @for(event of upNext;track event.id){<div class="agenda-row"><div class="agenda-time"><strong>{{timeLabel(event.start)}}</strong><span>{{dateLabel(event.date)}}</span></div><span class="agenda-line" [class]="event.type==='work'?'orange-line':event.type==='assignment'?'violet-line':'blue-line'"></span><div class="agenda-description"><strong>{{event.title}}</strong><small>{{labelFor(event)}} @if(event.course){· {{event.course}}}</small></div><span class="agenda-arrow">›</span></div>}
     @empty{<div class="mini-empty">No upcoming commitments. Add your first event in Calendar.</div>}
   </div></section>
   <section class="surface-card focus-card"><div class="card-heading"><div><h3>Keep on track</h3><p>Assignments to focus on</p></div><a routerLink="/assignments">View all <span>→</span></a></div><div class="task-list">
     @for(task of nextAssignments;track task.id){<div class="task-row"><span class="task-check" aria-hidden="true"></span><div><strong>{{task.title}}</strong><small>{{task.course}}</small></div><span class="due-label" [class]="task.date<=today?'urgent':'normal'">{{dateLabel(task.date)}}</span></div>}
     @empty{<div class="mini-empty">No unfinished assignments yet.</div>}
   </div><a routerLink="/to-do" class="soft-link">View daily to-do list <app-icon name="arrow" /></a></section>
  </div>
 `
})
export class DashboardComponent {
 constructor(public readonly store:ScheduleService){}
 today=todayKey();
 private get weekEnd():number{const today=new Date();const dow=(today.getDay()+6)%7;today.setHours(0,0,0,0);today.setDate(today.getDate()+7-dow);return today.getTime();}
 private get weekStart():number{const today=new Date();const dow=(today.getDay()+6)%7;today.setHours(0,0,0,0);today.setDate(today.getDate()-dow);return today.getTime();}
 private get nextWeek():number{return Date.now()+7*24*60*60*1000;}
 get classCount():number{return this.store.classes().filter(e=>eventTimestamp(e)>=this.weekStart&&eventTimestamp(e)<this.weekEnd).length;}
 get assignmentCount():number{return this.store.openAssignments().filter(e=>eventTimestamp(e)<this.nextWeek).length;}
 get shiftCount():number{return this.store.shifts().filter(e=>eventTimestamp(e)>=Date.now()&&eventTimestamp(e)<this.nextWeek).length;}
 get metrics(){return [
  {title:'Classes this week',value:this.classCount,detail:'On your timetable',icon:'graduation',tone:'blue',link:'/calendar'},
  {title:'Assignments due',value:this.assignmentCount,detail:'Due soon or overdue',icon:'assignment',tone:'violet',link:'/assignments'},
  {title:'Upcoming shifts',value:this.shiftCount,detail:'Within 7 days',icon:'briefcase',tone:'amber',link:'/work-shifts'},
  {title:'Schedule conflicts',value:this.store.conflicts().length,detail:'Class / shift overlaps',icon:'alert',tone:'rose',link:'/conflict-alerts'}
 ];}
 get upNext():CalendarEvent[]{return this.store.calendarEvents().filter(e=>eventTimestamp(e)>=Date.now()).sort((a,b)=>eventTimestamp(a)-eventTimestamp(b)).slice(0,5);}
 get nextAssignments():CalendarEvent[]{return this.store.openAssignments().slice(0,5);}
 dateLabel=formatDate;timeLabel=formatTime;
 labelFor(event:CalendarEvent):string{return {class:'Class',assignment:'Assignment',work:'Work shift',campus:'Campus event'}[event.type];}
}
