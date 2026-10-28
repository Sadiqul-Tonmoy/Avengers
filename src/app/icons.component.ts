import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      @switch (name) {
        @case ('dashboard') { <rect x="3" y="3" width="7" height="9" rx="1.4"/><rect x="14" y="3" width="7" height="5" rx="1.4"/><rect x="14" y="12" width="7" height="9" rx="1.4"/><rect x="3" y="16" width="7" height="5" rx="1.4"/> }
        @case ('calendar') { <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/><path d="M8 14h3M8 17h3M15 14h2"/> }
        @case ('assignment') { <rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h4"/> }
        @case ('briefcase') { <rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a20 20 0 0 0 18 0M11 12v2h2v-2"/> }
        @case ('events') { <path d="M5 3v3M19 3v3M3 10h18"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="m12 12 1.1 2.2 2.4.4-1.8 1.7.4 2.4-2.1-1.1-2.1 1.1.4-2.4-1.8-1.7 2.4-.4z"/> }
        @case ('todo') { <path d="m3 7 2 2 4-4M12 7h9M3 17l2 2 4-4M12 17h9"/> }
        @case ('alert') { <path d="m10.3 4.1-8.1 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-2.9l-8-14a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/> }
        @case ('bell') { <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/> }
        @case ('menu') { <path d="M4 7h16M4 12h16M4 17h16"/> }
        @case ('close') { <path d="M5 5l14 14M19 5 5 19"/> }
        @case ('arrow') { <path d="M5 12h14m-6-6 6 6-6 6"/> }
        @case ('clock') { <circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/> }
        @case ('check') { <path d="m4 12 5 5L20 6"/> }
        @case ('graduation') { <path d="m2 9 10-5 10 5-10 5-10-5zM6 11v5c3.7 3 8.3 3 12 0v-5M22 9v7"/> }
        @case ('sparkle') { <path d="m12 2 1.9 7.1L21 11l-7.1 1.9L12 20l-1.9-7.1L3 11l7.1-1.9L12 2zM20 19l1 2"/> }
        @case ('pin') { <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="2.5"/> }
        @default { <circle cx="12" cy="12" r="9"/> }
      }
    </svg>
  `
})
export class IconComponent { @Input() name = 'dashboard'; }
