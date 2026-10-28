import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from './icons.component';
import { ScheduleService } from './schedule.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, IconComponent],
  template: `
    <div class="app-shell">
      @if (menuOpen) { <button class="backdrop" aria-label="Close menu" (click)="menuOpen = false"></button> }
      <aside class="sidebar" [class.sidebar-open]="menuOpen" aria-label="Main navigation">
        <a class="brand" routerLink="/dashboard" (click)="menuOpen = false">
          <span class="brand-mark"><span></span><span></span><span></span><span></span></span>
          <span><strong>Campus<span class="brand-accent">Flow</span></strong><small>STUDENT PLANNER</small></span>
        </a>
        <div class="sidebar-label">WORKSPACE</div>
        <nav class="nav-list" aria-label="CampusFlow pages">
          @for (item of items; track item.link) {
            <a [routerLink]="item.link" routerLinkActive="nav-active" [routerLinkActiveOptions]="{ exact: true }" class="nav-item" (click)="menuOpen = false">
              <app-icon [name]="item.icon" /><span>{{ item.label }}</span>
              @if (item.label === 'Conflict Alerts' && store.conflicts().length > 0) { <span class="nav-count" aria-label="Active conflicts">{{ store.conflicts().length }}</span> }
            </a>
          }
        </nav>
        <div class="side-bottom">
          <div class="side-help"><span class="help-stars">✦</span><strong>One place. Less stress.</strong><p>Manage class, work, and campus life together.</p></div>
          <div class="side-footer">Avengers Team <span>•</span> CampusFlow v1.0</div>
        </div>
      </aside>
      <div class="content-shell">
        <header class="topbar">
          <div class="topbar-left">
            <button class="menu-toggle" aria-label="Open navigation" (click)="menuOpen = !menuOpen"><app-icon [name]="menuOpen ? 'close' : 'menu'" /></button>
            <div class="topbar-breadcrumb">Student workspace <span>/</span> CampusFlow</div>
          </div>
          <div class="topbar-right"><span class="demo-chip"><span class="demo-dot"></span> Saved locally</span><div class="avatar" aria-label="Demo student">S</div></div>
        </header>
        <main class="page-body" id="main-content"><router-outlet /></main>
      </div>
    </div>
  `
})
export class AppComponent {
  constructor(public readonly store: ScheduleService) {}
  menuOpen = false;
  items = [
    { label: 'Dashboard', icon: 'dashboard', link: '/dashboard' },
    { label: 'Calendar', icon: 'calendar', link: '/calendar' },
    { label: 'Assignments', icon: 'assignment', link: '/assignments' },
    { label: 'Work Shifts', icon: 'briefcase', link: '/work-shifts' },
    { label: 'Campus Events', icon: 'events', link: '/campus-events' },
    { label: 'To-Do List', icon: 'todo', link: '/to-do' },
    { label: 'Conflict Alerts', icon: 'alert', link: '/conflict-alerts' },
    { label: 'Reminders', icon: 'bell', link: '/reminders' }
  ];
}
