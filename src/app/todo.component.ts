import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IconComponent } from './icons.component';
import { CalendarEvent, Priority, ScheduleService, TodoTask, formatDate, todayKey, validDate } from './schedule.service';

@Component({
 selector:'app-todo', standalone:true, imports:[FormsModule, RouterLink, IconComponent],
 template:`
 <div class="page-header calendar-page-header"><div><div class="eyebrow">FOCUS ON WHAT MATTERS</div><h1>Daily To-Do List</h1><p>Manage personal tasks and coursework in one place.</p></div><button class="calendar-primary" (click)="add()">+ Add task</button></div>
 <div class="shift-summary"><div class="surface-card shift-stat"><span>Open personal tasks</span><strong>{{openCount}}</strong><small>Tasks remaining</small></div><div class="surface-card shift-stat"><span>Incomplete assignments</span><strong>{{store.openAssignments().length}}</strong><small>Linked to Assignment Tracker</small></div></div>
 <section class="surface-card section-card"><div class="card-heading"><div><h3>Assignment priorities</h3><p>Upcoming and overdue coursework appears automatically.</p></div><a routerLink="/assignments" class="calendar-outline shift-button-link">Manage assignments</a></div>
 <div class="section-items">
 @for (item of dueAssignments;track item.id){<article class="shift-entry"><button type="button" class="demo-checkbox task-check-button" (click)="completeAssignment(item)" [attr.aria-label]="'Complete '+item.title"><app-icon name="check"/></button><div class="item-copy"><strong>{{item.title}}</strong><small>{{item.course}} · Due {{dateLabel(item.date)}}</small><span class="shift-notes">{{item.date < today ? 'Overdue' : item.date === today ? 'Due today' : 'Upcoming'}} · {{item.status}}</span></div><span class="status-pill amber">{{item.status}}</span></article>}
 @empty {<div class="mini-empty">No incomplete assignments due in the next seven days.</div>}
 </div></section>
 <section class="surface-card section-card task-section"><div class="card-heading"><div><h3>My tasks</h3><p>Create tasks, set priorities, and check them off.</p></div><span class="item-count">{{store.tasks().length}} tasks</span></div><div class="section-items">
 @for (task of store.sortedTasks();track task.id){<article class="shift-entry"><button class="demo-checkbox task-check-button" type="button" [class.checked]="task.done" (click)="store.toggleTask(task.id)" [attr.aria-label]="(task.done ? 'Mark incomplete: ':'Mark complete: ')+task.title"><app-icon name="check" /></button><div class="item-copy"><strong [class.completed]="task.done">{{task.title}}</strong><small>{{dateLabel(task.date)}} · {{task.priority}} priority</small>@if (task.notes){<span class="shift-notes">{{task.notes}}</span>}</div><div class="entry-controls"><span class="status-pill" [class.teal]="task.done" [class.rose]="!task.done && task.priority==='High'" [class.blue]="!task.done && task.priority!=='High'">{{task.done?'Completed':task.priority}}</span><button type="button" class="calendar-outline" (click)="edit(task)">Edit</button><button type="button" class="calendar-danger" (click)="remove(task)">Delete</button></div></article>}
 @empty {<div class="shift-empty"><app-icon name="todo"/><h3>No personal tasks yet</h3><p>Add your first task to start planning the day.</p><button class="calendar-primary" (click)="add()">Add task</button></div>}
 </div></section>
 @if (formOpen){<div class="calendar-modal-backdrop"><div class="calendar-dialog" role="dialog" aria-modal="true" aria-labelledby="task-form-heading">
  <div class="calendar-dialog-head"><div><div class="eyebrow">YOUR TASKS</div><h2 id="task-form-heading">{{editingId?'Edit task':'Add task'}}</h2></div><button class="calendar-close" type="button" (click)="close()" aria-label="Close">×</button></div>
  <form class="calendar-form" (ngSubmit)="save()"><div class="calendar-field"><label for="task-title">Task title *</label><input id="task-title" name="title" [(ngModel)]="draft.title" maxlength="100" required /></div>
  <div class="calendar-form-grid"><div class="calendar-field"><label for="task-date">Target date *</label><input id="task-date" name="date" type="date" [(ngModel)]="draft.date" required /></div><div class="calendar-field"><label for="task-priority">Priority</label><select id="task-priority" name="priority" [(ngModel)]="draft.priority"><option value="High">High</option><option value="Medium">Medium</option><option value="Low">Low</option></select></div></div>
  <div class="calendar-field"><label for="task-notes">Notes</label><textarea id="task-notes" name="notes" [(ngModel)]="draft.notes" maxlength="500" rows="2"></textarea></div>
  <label class="simple-checkbox"><input type="checkbox" name="done" [(ngModel)]="draft.done" /> Completed</label>
  @if (error){<p class="calendar-form-error" role="alert">{{error}}</p>}
  <div class="calendar-form-footer"><span class="calendar-form-spacer"></span><button class="calendar-outline" type="button" (click)="close()">Cancel</button><button class="calendar-primary" type="submit">{{editingId?'Save changes':'Add task'}}</button></div></form>
 </div></div>}
 `
})
export class TodoComponent {
 today=todayKey(); editingId:string|null=null;formOpen=false;error=''; draft:TodoTask=this.blank();
 constructor(public readonly store:ScheduleService){}
 get openCount():number{return this.store.tasks().filter(t=>!t.done).length;}
 get dueAssignments():CalendarEvent[]{const cutoff=new Date();cutoff.setDate(cutoff.getDate()+7);const end=`${cutoff.getFullYear()}-${String(cutoff.getMonth()+1).padStart(2,'0')}-${String(cutoff.getDate()).padStart(2,'0')}`;return this.store.openAssignments().filter(a=>a.date<=end);}
 dateLabel=formatDate;
 private blank():TodoTask{return{id:'',title:'',date:todayKey(),priority:'Medium',done:false,notes:''};}
 add():void{this.editingId=null;this.draft=this.blank();this.error='';this.formOpen=true;}
 edit(task:TodoTask):void{this.editingId=task.id;this.draft={...task};this.error='';this.formOpen=true;}
 close():void{this.formOpen=false;this.error='';}
 save():void{if(!this.draft.title.trim()||!validDate(this.draft.date)){this.error='Enter a task title and valid target date.';return;}this.store.upsertTask({...this.draft,id:this.editingId ?? this.store.newId(),title:this.draft.title.trim(),notes:this.draft.notes.trim()});this.close();}
 remove(task:TodoTask):void{if(window.confirm(`Delete task “${task.title}”?`))this.store.deleteTask(task.id);}
 completeAssignment(event:CalendarEvent):void{this.store.setAssignmentStatus(event.id,'Completed');}
}
