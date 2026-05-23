# SimpleTask

> A small to-do app that remembers what you **did** — not just what's left to do.
> Built by hand in HTML, CSS, and vanilla JavaScript. No frameworks. No backend.

[**Live demo →**](https://nabintousfofana.github.io/simple-task-tracker/)

![SimpleTask screenshot](task%20tracker.png)

---

## The idea

Most to-do apps are subtractive. You finish something, it disappears, and the only thing that grows is the list of what's left to do. That always felt a little hostile to me — like the app only ever notices what you haven't done.

SimpleTask flips the lens. When you check a task off, it doesn't get deleted. It slides into a small **dated history** below, with a quiet running count of how many things you've finished today, this week, and ever. Because some days the most honest thing a to-do app can do is remind you that you *did* show up.

That's the whole project.

---

## What's inside

A single page. Three local files. Zero dependencies.

- **Per-browser, per-email scoping** — type your email and your tasks save to that key in `localStorage`. Two people on the same shared computer can keep separate lists without anyone signing up for anything.
- **Guest mode** — skip the email entirely if you're just trying it out.
- **Dated history** — completed tasks move to a history list below, timestamped (`Today`, `Yesterday`, `Mon · 6:42 PM`, or the full date for anything older).
- **Stats that count what matters** — finished today, this week, all-time. The today number gives a little animation bump every time you complete something.
- **Filter the history** — `Today / Week / All`.
- **Undo for accidents** — a small toast appears after each completion with an `Undo` button for a few seconds.
- **Dark mode** — respects your system preference on first visit, then remembers your choice.
- **Honest about itself** — the login screen is explicit that this isn't real authentication. Your email is a storage key, nothing more.

---

## What I deliberately *didn't* add

- ❌ A backend
- ❌ A framework
- ❌ Drag-and-drop reordering
- ❌ Categories or tags
- ❌ Reminders
- ❌ Real user authentication
- ❌ Analytics, tracking, or third-party scripts

The whole point of the project was to build something useful with the smallest possible stack. There's a future version of this with real auth, ordering, and tags — but the small instinct came first, and I'm glad I built it before reaching for a framework.

---

## Tech

- **HTML5** — semantic landmarks, real `<button>` elements, ARIA where it matters
- **CSS3** — custom properties, system-pref dark mode, no resets beyond the basics
- **Vanilla JavaScript** — single IIFE, delegated event handlers, `crypto.randomUUID()` for task IDs, XSS-safe rendering (no `innerHTML` for user content)

The data model is intentionally tiny:

```js
{
  currentUser: 'you@example.com' | '__guest__' | null,
  users: {
    'you@example.com': {
      tasks:     [{ id, text, createdAt }],
      completed: [{ id, text, completedAt }]
    }
  }
}
```

State is persisted to `localStorage` under the key `simpletask.v2`. If you had data from the original SimpleTask, it migrates automatically on first load.

---

## Run it locally

```bash
git clone https://github.com/NabintouSFofana/simple-task-tracker.git
cd simple-task-tracker
open index.html
```

Or just double-click `index.html`. There's nothing to install.

---

## What I learned

The technical part is what you'd expect: DOM manipulation, event delegation, `localStorage` as a tiny database, date formatting in plain JS.

But the lesson I actually carry with me is smaller and more design-shaped: **a to-do app that only ever shows you what's left will always feel like a chore.** Showing what you finished changes how it feels to use. That insight didn't come from a tutorial or a framework — it came from building the simplest version, using it for a week, and realizing the part I kept wanting wasn't a feature, it was a point of view.

---

## Roadmap

If I come back to this with more time:

- Real authentication (Firebase or Supabase, whichever feels right)
- Drag-and-drop ordering for active tasks
- Tags and per-tag stats
- A weekly heatmap of completed tasks
- Mobile PWA install / offline

---

## Author

**Nabintou S. Fofana**
Software engineering student · front-end developer
[Portfolio](https://nabintousfofana.github.io/portfolio/) · [GitHub](https://github.com/NabintouSFofana) · [LinkedIn](https://www.linkedin.com/in/nabintousfofana)
