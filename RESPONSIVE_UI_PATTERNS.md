# Responsive UI Patterns (Small Screens)

This project is **mobile-first**: the default classes should work at **360×800** (Samsung S20-class) and ideally **320×640** (very small).

This doc is a **copy/paste playbook** for recurring UI patterns that have caused misalignment, clipping, or cramped layouts.

## Target sizes (devtools)

Use these as a quick sanity sweep:

- 320×640 (smallest common)
- 360×800 (Samsung S20-ish)
- 390×844 (iPhone 12/13)

If something works at 320px wide, it will almost always be fine everywhere else.

---

## Principles (Tailwind + React)

### 1) Mobile-first breakpoints

- Default = phone.
- Add `sm:` and `md:` progressively.
- Prefer `flex-col sm:flex-row` and `w-full sm:w-auto` for any header/action bar.

### 2) Avoid “fixed” layout assumptions

Prefer:
- `w-full`, `max-w-*`, `min-w-0`, `truncate`
- `flex-wrap` for chips/badges
- `overflow-x-auto` for tab rows

Avoid:
- hard `w-[800px]` or big `px-12` without a mobile override
- `text-6xl` without `text-4xl sm:text-5xl md:text-6xl`

### 3) Always allow long content to shrink

If a row contains text + buttons:
- put `min-w-0` on the text container
- use `truncate` on the text
- avoid `justify-between` unless you also control wrapping

### 4) Buttons: full-width on mobile

A single rule fixes lots of issues:

- `w-full sm:w-auto justify-center`

---

## Recipes (copy/paste)

### A) Page header with title + 1–2 CTAs (prevents floating/overlapping)

Use this for pages like **Feedback Library** and **Projects**.

```tsx
<div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-zinc-100 pb-6 sm:pb-8">
  <div>
    <h1 className="text-4xl sm:text-5xl font-bold tracking-tighter text-zinc-950">Title</h1>
    <p className="text-base sm:text-xl text-zinc-500 mt-2 font-light max-w-2xl">Subtitle</p>
  </div>

  <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full md:w-auto">
    <button className="w-full sm:w-auto justify-center ...">Secondary</button>
    <button className="w-full sm:w-auto justify-center ...">Primary</button>
  </div>
</div>
```

Why it works:
- Stacks on mobile.
- Buttons become full-width on mobile so they never hang off-screen.

### B) “Share link” row: input + Copy + Open (fixes cramped alignment)

This is the exact pattern that broke in the Forms list.

```tsx
<div className="flex flex-col sm:flex-row sm:items-center gap-2">
  <input
    className="w-full sm:flex-1 min-w-0 ..."
    value={shareLink}
    readOnly
  />

  <div className="flex items-center gap-2 w-full sm:w-auto">
    <button className="flex-1 sm:flex-none justify-center ...">Copy Link</button>
    <a className="p-2 ..." aria-label="Open share link" title="Open">...</a>
  </div>
</div>
```

Key details:
- `min-w-0` prevents the input from forcing overflow.
- Buttons live in a second wrapper so the group can size independently.

### C) Tabs with long labels (Context Library) — horizontal scroll on mobile

When there are 3–6 tabs, wrapping looks messy; scrolling is more predictable.

```tsx
<div className="-mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto border-b border-zinc-200">
  <button className="shrink-0 whitespace-nowrap px-4 sm:px-6 py-3 ...">Tab 1</button>
  <button className="shrink-0 whitespace-nowrap px-4 sm:px-6 py-3 ...">Tab 2</button>
  <button className="shrink-0 whitespace-nowrap px-4 sm:px-6 py-3 ...">Tab 3</button>
</div>
```

Notes:
- `-mx-4 px-4` lets the scroll area reach screen edges, matching page padding.
- `shrink-0 whitespace-nowrap` ensures each tab remains readable.

### D) Stat cards with huge numbers

If you want a “big” feel without crushing phones:

```tsx
<div className="text-[11px] sm:text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Label</div>
<div className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tighter text-zinc-950">123</div>
```

### E) Dense sections: reduce padding on mobile only

Pattern:

- `p-5 sm:p-8 md:p-12`

Use it for large cards like the report sections.

### F) Popovers/dropdowns/modals: never clip on short screens

Rules:
- Always cap height + allow scroll.
- Prefer `fixed` positioning on mobile.

Example dropdown container:

```tsx
<div className="fixed left-4 right-4 top-24 max-h-[calc(100vh-8rem)] overflow-auto ... md:absolute md:right-0 md:mt-2 md:w-64">
```

Example menu:

- Add `max-h-[calc(100vh-7rem)] overflow-y-auto`

---

## Checklist (before shipping)

- No horizontal scrolling unless intentional (tabs are OK).
- Headers: titles + CTAs stack and stay inside the viewport.
- Any row with text + buttons has `min-w-0` on the text side.
- Any overlay/menu has a max-height and is scrollable.
- Typography: `text-6xl` always has smaller mobile sizes.

---

## References (in this repo)

- Forms share-link row: `components/FormBuilder.tsx`
- Feedback Library header: `components/FeedbackLibrary.tsx`
- Context Library tabs: `components/ContextManager.tsx`
- Report responsiveness: `components/AnalysisView.tsx`
- Mobile-safe dropdown: `components/LanguageSwitcher.tsx`
