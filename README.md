# Today I Learned (TIL)

A small web app where users can share and read interesting facts, backed by
a cloud-hosted Postgres database (Supabase) and deployed as a static site on
Vercel.

---

## What this project does

* Fetches and displays facts from a Supabase (Postgres) backend
* Lets users share a new fact with a source link and category
* Filters facts by category from the sidebar
* Lets users upvote facts as Interesting 👍, Mindblowing 🤯, or False ⛔️,
  with the vote persisted back to the database
* Shows loading / empty / error states instead of a blank screen
* Responsive layout down to mobile

---

## Tech used

* HTML, CSS, JavaScript — no framework, no build step
* [Supabase](https://supabase.com) — hosted Postgres + auto-generated REST API
* [Vercel](https://vercel.com) — static hosting / CDN

## Why this fits a cloud computing project

This app is a good example of the "static frontend + managed backend"
pattern common in cloud-native apps:

* **Vercel** builds nothing (it's plain HTML/CSS/JS) and serves the site
  from its global edge CDN — no server for you to run or patch.
* **Supabase** provides the database, the REST API, auth, and row-level
  security (RLS) as managed cloud services, reached directly from the
  browser over HTTPS.
* There's no backend code you own or deploy — both layers are fully
  managed cloud services, which is worth calling out explicitly if you're
  writing this up for a course.

---

## Project structure

```
index.html   → structure of the app
style.css    → styling
script.js    → all app logic: fetching, rendering, filtering, posting, voting
logo.png     → app logo
vercel.json  → static hosting config for Vercel
```

---

## Running locally

No build step needed. Either:

```bash
# open directly
open index.html

# or serve it (recommended, avoids some browser file:// quirks)
npx serve .
```

---

## Deploying on Vercel

**Option A — Vercel dashboard (no CLI needed)**
1. Push this repo to GitHub (already done: `Charvigosala/share-a-fact`).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework preset: **Other** (it's a static site — no build command,
   no output directory needed).
4. Click **Deploy**. Vercel gives you a live `*.vercel.app` URL.

**Option B — Vercel CLI**
```bash
npm i -g vercel
vercel        # first deploy, follow the prompts
vercel --prod # promote to production
```

Every push to `main` will auto-deploy once the GitHub repo is connected.

---

## Before you deploy: check your Supabase RLS policies

The Supabase `anon` key in `script.js` is meant to be public — that's how
Supabase's client-side model works. What actually protects your data is
**Row Level Security (RLS)** on the `facts` table in your Supabase project:

* `SELECT` — allow for everyone (so the feed loads)
* `INSERT` — allow for everyone if you want anonymous posting, or restrict
  it if you add auth later
* `UPDATE` — should be scoped to just the vote columns, not arbitrary
  columns, otherwise anyone can edit any fact's text/source

Double-check these in **Supabase → Authentication → Policies** before
sharing the live link.

---

## Things that could still be improved

* Add real auth (Supabase Auth) so votes/posts are tied to a user
* Rate-limit or debounce voting to prevent spam-clicking
* Add pagination / infinite scroll once the facts table grows
* Add a proper toast/notification component instead of `alert()`

---

## Author

Gosala Venkata Charvi
