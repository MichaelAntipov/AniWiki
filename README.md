Formatted Version: https://docs.google.com/document/d/1IqdKxLAzLZnTSvVhHK20aUMVk-dyrEMcHyOK7sw6Ik8/edit?usp=sharing

AniWiki
AniWiki is a simple, single‐page anime & character “wiki” where you can:
Browse the top anime and characters


Search by name (anime and characters, with pagination)


View detailed pages (synopsis, genres, studios, voice actors, plus an Amazon link)


Toggle between light and dark themes


Take a 5-question quiz for a quick anime recommendation


Live demo: https://aniwiki.onrender.com/

Installation & Running Locally
Clone the repo
 git clone https://github.com/MichaelAntipov/AniWiki.git
 cd AniWiki


Install dependencies
 npm install


(Optional) Create a .env file in the project root to override the port, e.g.:
 PORT=4000
 If you skip this, the app runs on port 3000 by default.


Start the server
 npm start
 Open your browser to http://localhost:3000



How It Was Built
HTML templates in index.html for each view (Home, Search, Details, Quiz)


Vanilla JS clones those templates, fills in data, and switches views via window.onhashchange


Express server in server.js serves static files and proxies /api/* calls to the Jikan API (avoids CORS)


CSS variables control light/dark themes; choice is saved in localStorage


Quiz logic: five yes/no answers → binary key → lookup table → anime title → redirect to its Details page



Unique Approaches
No build toolchain: pure ES6 in the browser—no React, Webpack, or bundlers


Template-driven rendering keeps code DRY and easy to follow


Single Express process handles both static hosting and API proxying


Lightweight design: small bundle, fast load, minimal dependencies


Additional features: Amazon link for anime merch, and an anime recommendation quiz.

Trade-Offs
No frontend framework
 • Pros: tiny bundle, zero build step
 • Cons: manual DOM updates, more boilerplate


Fresh fetch on every view
 • Pros: always up-to-date data
 • Cons: extra network requests (could add caching later)


Static quiz mapping
 • Pros: predictable, instant recommendations
 • Cons: not adaptive or personalized over time



Known Bugs & Limitations
When you go to the hosted website aniwiki.onrender.com, requests may be delayed by 50 seconds.



Why This Tech Stack
Node.js & Express: quick to set up a static server and API proxy


Vanilla JavaScript: minimal dependencies, fast initial load, easy browser debugging


CSS Variables & Flex/Grid: built-in theming and responsive layouts without extra libraries


Jikan API: free, up-to-date MyAnimeList data, recommended by the prompt
