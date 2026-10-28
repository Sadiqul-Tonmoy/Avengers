import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { CalendarComponent } from './calendar.component';
import { AssignmentsComponent } from './assignments.component';
import { CampusEventsComponent } from './campus-events.component';
import { TodoComponent } from './todo.component';
import { RemindersComponent } from './reminders.component';
import { WorkShiftsComponent } from './work-shifts.component';
import { ConflictAlertsComponent } from './conflict-alerts.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardComponent, title: 'Dashboard | CampusFlow' },
  { path: 'calendar', component: CalendarComponent, title: 'Calendar | CampusFlow' },
  { path: 'assignments', component: AssignmentsComponent, title: 'Assignments | CampusFlow' },
  { path: 'work-shifts', component: WorkShiftsComponent, title: 'Work Shifts | CampusFlow' },
  { path: 'campus-events', component: CampusEventsComponent, title: 'Campus Events | CampusFlow' },
  { path: 'to-do', component: TodoComponent, title: 'To-Do List | CampusFlow' },
  { path: 'conflict-alerts', component: ConflictAlertsComponent, title: 'Conflict Alerts | CampusFlow' },
  { path: 'reminders', component: RemindersComponent, title: 'Reminders | CampusFlow' },
  { path: '**', redirectTo: 'dashboard' }
];
