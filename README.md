# SimpleTask

A small to-do app that keeps track of what you've finished, not just what's left.

**Live:** https://nabintousfofana.github.io/simple-task-tracker/

<img width="991" height="865" alt="image" src="https://github.com/user-attachments/assets/afdc0a10-9cbe-4570-9552-bb5c376e217e" />


## What it does

You type your email, add tasks, check them off. When you check a task off, it doesn't disappear — it slides into a dated history below, with a small counter that shows how many things you've done today.

I built it because most to-do apps make the finished list disappear, which means the only thing that grows is what you still have to do. Some days I needed to see proof that I'd done something.

## Features

- Add, check off, delete tasks
- Dated history of completed tasks with a daily counter
- Dark mode toggle
- Two people can share the same browser without seeing each other's lists (each email gets its own storage)
- Everything saves between visits — no backend, no login

## Run it locally

```bash
git clone https://github.com/NabintouSFofana/simple-task-tracker.git
cd simple-task-tracker
# Open index.html in your browser. That's it.
```

## Built with

HTML, CSS, vanilla JavaScript. No frameworks, no build step, no dependencies. Data lives in `localStorage`.

## What I learned

DOM manipulation, event handling, and using `localStorage` as a tiny database. The bigger thing was watching how a small design choice — keeping finished tasks visible — changed how I felt about using the app.

## License

MIT — see [LICENSE](LICENSE).

---

Built by [Nabintou S. Fofana](https://nabintousfofana.github.io/portfolio/) · 2025
