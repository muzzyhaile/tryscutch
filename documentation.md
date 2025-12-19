# Header & Toolbar Responsiveness (Small Screens)

Target: prevent horizontal overflow / “wiggle room” at very small widths (Samsung S20 class ~360px) across app headers, report toolbars, and footer nav.

## Goals
- No horizontal page scrolling caused by headers/toolbars.
- Action rows wrap/stack cleanly on small screens.
- Long strings (emails, URLs, titles) never force viewport expansion.
- Navigation remains usable when the desktop sidebar is hidden.

## Rules (patterns to reuse)
### 1) Mobile-first stacking
Use column layout by default, then switch to row at `sm:`.
- `flex flex-col sm:flex-row sm:items-center`

### 2) Wrap button clusters
For toolbars with multiple buttons, allow wrap.
- `flex flex-wrap gap-2 sm:gap-3`

### 3) Prevent long text overflow in flex
When a flex child contains long text, add `min-w-0` and then truncate.
- Container: `min-w-0`
- Text: `truncate` + a reasonable `max-w-*` on small screens

### 4) Full-width controls on mobile
Inputs/selects/buttons should be full width on mobile and auto width at `sm:`.
- `w-full sm:w-auto`
- Inputs in row: `min-w-0 w-full sm:flex-1`

### 5) Avoid adding new global breakpoints
Prefer Tailwind’s default mobile-first utilities (`sm:` and up).
Only use `max-[360px]:...` when a specific label still overflows.

## What was fixed (Dec 19, 2025)
### Shared app header
- components/Layout.tsx
  - Reduced mobile padding (`px-4 sm:px-6 md:px-12`) to keep more room on small screens.
  - Added a minimal mobile navigation menu for `<md` so navigation is usable when the sidebar is hidden.
  - Constrained dropdown width on small screens (`w-[min(16rem,calc(100vw-2rem))]`).
  - Reduced main content padding on mobile (`p-4 sm:p-6 ...`) to avoid tight layouts.

### Reports
- components/AnalysisView.tsx
  - Header action cluster now stacks on mobile and wraps buttons.
  - Reduced button horizontal padding on mobile.
  - Export button label becomes shorter on small screens ("Export" vs "Export Report").

- components/SampleReportPage.tsx
  - Theme overview header stacks on mobile.
  - Table header row hidden on mobile to avoid cramped/overflow-prone grid headers.

### Responses
- components/ResponseViewer.tsx
  - Filters/actions now stack on mobile; buttons go full-width at small sizes.
  - Response metadata wraps; long emails truncate instead of expanding the row.

### Other overflow hotspots
- components/BillingView.tsx
  - Seats row stacks on mobile; “Manage Seats” button becomes full-width.

- components/SettingsView.tsx
  - Invite link + copy button stack on mobile; input is `min-w-0` so it can shrink.

### Legal / public footers
- components/LegalLayout.tsx
  - Title truncates to prevent header overflow.
  - Footer links wrap.

- components/PublicForm.tsx
  - Footer links wrap.

## Fixed to-do list (keep current)
- [x] Add mobile nav affordance for app shell (<md)
- [x] Wrap/stack report header actions (AnalysisView)
- [x] Make Responses toolbar (filters/actions) responsive
- [x] Fix long metadata (email) overflow in Responses
- [x] Stack Billing seats action row on small screens
- [x] Prevent Settings invite link row from overflowing
- [x] Wrap footer nav links (LegalLayout, PublicForm)

## Verification checklist
Use Chrome DevTools responsive mode:
- 360×800 (Samsung S20-like)
- 320×700 (smallest common)

Check:
- No horizontal scrollbar on any page.
- Report header actions remain fully visible and tappable.
- Dropdown menus stay within viewport.
- Long email/URL values do not expand the viewport.
