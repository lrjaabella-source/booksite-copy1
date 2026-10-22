# Bookworm

Bookworm is a browser-based reading tracker for organizing a personal book collection, recording reading progress, and keeping a daily reading streak.

## Project Links

- **GitHub repository:** [S0Iomon/G22-ws-t-bookworm](https://github.com/S0Iomon/G22-ws-t-bookworm)
- **Live web application:** [Bookworm on GitHub Pages](https://s0iomon.github.io/G22-ws-t-bookworm/)
- **Workflow worksheet:** [Browser-Based Application Development Workflow](https://docs.google.com/spreadsheets/d/1Dcc6HQ06H-PPQb5HkpUq9p9t4cSmBx068XOl37uzfJM/edit?usp=sharing)

> The GitHub Pages link serves the static frontend. Express-backed features such as account login, search, and streak syncing require the Node.js server; GitHub Pages does not run that server.

## Features

- **Dashboard:** View library statistics and a featured current read.
- **Bookshelf:** Browse books by cover and select a book to jump to its reading-status section.
- **Reading statuses:** Books are categorized as Want to Read, Currently Reading, or Finished Reading.
- **Progress tracking:** Update a bookmark page. Page 0 means Want to Read, progress before the final page means Currently Reading, and the final page means Finished Reading.
- **Add and edit books:** Store a title, author, genre, page count, current page, optional cover URL, and description.
- **Search:** Search the server catalogue by title, author, or genre. On mobile, search is available in the hamburger menu.
- **Daily streaks:** Record a reading day when progress advances. The app displays current and best streaks and a Sunday-through-Saturday weekly check-in view.
- **Accounts:** Register, log in, and log out through the Express backend.
- **Profile:** View and edit profile details.
- **Responsive navigation:** Use the collapsible hamburger menu on mobile.

## Run Locally

Install [Node.js](https://nodejs.org/) and then run:

```bash
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Use the **Log in** button to create an account or sign in. Restart the server with `Ctrl+C` followed by `npm start` after changing backend code.

## Storage Notes

- Books and profile edits are stored in the browser with `localStorage`.
- Search reads the server-side catalogue in `data/books.json`; books added only in the browser are not included in server search.
- Reading activity is stored by the server in `data/streak.json`.
- Account records and sessions are stored under `data/.auth/`. Passwords are stored as scrypt hashes. Keep this runtime data private and out of public repositories.
- Accounts currently provide login/logout, but book collections, profiles, and streaks are not separated by account or synchronized across devices.

## Project Structure

```text
Bookworm/
├── app.js             # Express server and API routes
├── index.html         # Page structure and dialogs
├── script.js          # Frontend interactions and local storage
├── styles.css         # Styling and responsive layout
├── data/
│   ├── books.json     # Server-side search catalogue
│   ├── streak.json    # Created by the server for reading activity
│   └── .auth/         # Created by the server for account/session data
├── resources/         # Images and other static assets
├── package.json
└── package-lock.json
```

## Technology

- HTML, CSS, and browser JavaScript
- Node.js and Express
- Browser `localStorage`
- Git and GitHub

## Project Team

- Nathaniel Avila
- Ghaylord Lugod
- Megg Cleofe Cagampang
- Aira Joie Piopongco
- Julie Ann Abella

## Academic Project

**MO-IT161 Web Systems and Technology — Group 22**  
**Project:** Browser-Based Application Development  
**Application:** Bookworm

## Development Workflow

- **Week 1:** Development progress
- **Week 2:** Project selection, repository creation, and initial collaboration
- **Week 3:** Wireframe and initial application design
- **Week 4:** Header, navigation, and content sections
- **Week 5:** Continued development, testing, and improvement planning

## Possible Future Improvements

- Store each reader’s books, profile, and streak under their account.
- Synchronize reading data across devices.
- Include browser-added books in backend search.
- Add reading notes, ratings, and more detailed goal controls.
- Continue improving validation, accessibility, and empty-state feedback.

---

⭐ **Bookworm — Organize your books. Track your progress.**
