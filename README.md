# CampusFlow — Complete Angular Student Planner

This is one complete university project folder (not an incremental patch). It has working client-side navigation and forms for the main CampusFlow features, including **add/edit/delete work shifts** and **automatic work-shift/class overlap alerts**. The old **“Next development step” / “Next Tip”** panel has been removed. The dashboard now uses saved data rather than hard-coded example counts.

## Start on Windows using VS Code

1. Extract **CampusFlow_Complete_Ready.zip** completely.
2. Open **CampusFlow_Complete_Ready** in VS Code (the folder that contains `package.json`).
3. In **Terminal > New Terminal**, run:

   ```cmd
   npm install
   npm start
   ```

4. Visit **http://localhost:4300**. Port **4300** is the default so old CampusFlow copies on 4200 or 4201 don't interfere.
5. Alternatively, double-click **RUN_CAMPUSFLOW_WINDOWS.bat** inside the extracted folder.

If port 4300 is taken, run `npm run start:custom -- --port 4400` and open `http://localhost:4400`.

To verify the Angular compiler after installing packages, run `npm run build`.

## Features

| Route | What works |
| --- | --- |
| `/dashboard` | Real counts for classes, unfinished assignments, shifts, and conflicts; upcoming commitments; optional example schedule |
| `/calendar` | Unified day/week calendar; add/edit/delete classes, assignments, shifts and campus events; browser persistence |
| `/assignments` | Create, edit, delete assignments; course, deadline and status; changes reflected in Calendar and To-Do |
| `/work-shifts` | **Add, edit and delete part-time shifts**; validation, confirmation, shared calendar; instant overlap warning |
| `/campus-events` | Create/edit/delete activities, category filter, RSVP/withdraw; only RSVPed events appear in Calendar |
| `/to-do` | Create/edit/delete tasks, priority and completion; upcoming incomplete assignments appear automatically |
| `/conflict-alerts` | Live class-versus-work-shift overlapping times, dates, and detailed alert list |
| `/reminders` | Toggle saved reminder preferences and see in-app reminders for the coming week |

### Test shift/class overlap

1. Open Calendar and create a **Class** on the same future date, from **10:00 to 11:00**.
2. Open Work Shifts and create a shift for that date, **10:30 to 12:00**.
3. Before saving the shift, its form warns you of the class overlap. Save the shift and open **Conflict Alerts**. You should see a 10:30–11:00 conflict.
4. Edit that shift to **11:00–12:00**. The conflict clears automatically. Back-to-back items are *not* considered overlapping.
5. Delete the shift and refresh; the deletion should remain saved.

**For a quick demonstration:** On a blank Dashboard, click **Load example schedule**. It creates a sample class/shift conflict, an assignment, an event, and a task. This only works when your planner is empty and does not overwrite your own entries.

## Implementation details

- Frontend: Angular 20 standalone components + Angular Router + FormsModule + TypeScript.
- Persistence: browser `localStorage` (not a database or account-based backend). Data is preserved between refreshes **on the same browser and localhost port**.
- Shared state: `src/app/schedule.service.ts` — calendar events, shifts, assignments, tasks, reminder settings, and overlap calculations.
- Conflict algorithm: compares same-day class/work time intervals. A conflict exists when `shift.start < class.end` and `class.start < shift.end`; events that just touch do not overlap.
- Date and input validation blocks empty or invalid dates/times and end times before start times.

## Current limitations

- This is a functional **client-side university demonstration**, not a deployed multi-user production service. It has **no database, log-in, push/email notification service**, or cross-device syncing.
- Reminders display inside CampusFlow; no push or email is sent.
- Same-day shifts/classes are supported; overnight shifts and recurring class schedules are not.
- Calendar/browser data under `localhost:4200`, `localhost:4201`, and `localhost:4300` are separate storage origins. Use the same port consistently.

## Structure

```text
CampusFlow_Complete_Ready/
  package.json
  angular.json
  RUN_CAMPUSFLOW_WINDOWS.bat
  README.md
  TESTING.md
  src/
    app/
      app.component.ts
      app.routes.ts
      dashboard.component.ts
      calendar.component.ts
      assignments.component.ts
      work-shifts.component.ts
      campus-events.component.ts
      todo.component.ts
      conflict-alerts.component.ts
      reminders.component.ts
      schedule.service.ts
      icons.component.ts
    styles.css
    main.ts
    index.html
```

## Verification notes

Source code syntax, strict TypeScript source checks (with local Angular declaration stubs), and automated data/overlap logic tests were completed during packaging. **A full Angular compilation was not possible in the packaging environment because npm registry network access was unavailable.** Please run `npm run build` on your own laptop. If that command reports a compiler error, share the complete output so it can be fixed precisely.
