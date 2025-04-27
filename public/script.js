// public/script.js
// ────────────────────────────────────────────────────────────────────────────
// Vanilla-JS SPA: hash router, data fetching, and UI rendering for AniWiki.
// ────────────────────────────────────────────────────────────────────────────
(() => {
  // ─── DOM references ─────────────────────────────────────────────────────────
  const app         = document.getElementById('app');
  const tmpl        = {
    home:      document.getElementById('home-template'),
    results:   document.getElementById('results-template'),
    details:   document.getElementById('details-template'),
    quiz:      document.getElementById('quiz-template'),
    card:      document.getElementById('card-template'),
    skeleton:  document.getElementById('skeleton-template'),
    error:     document.getElementById('error-template'),
  };
  const searchInput = document.getElementById('search-input');
  const searchBtn   = document.getElementById('search-btn');
  const modeSelect  = document.getElementById('search-mode');
  const themeToggle = document.getElementById('theme-toggle');

  let currentQuery = '';
  let currentPage  = 1;
  let mode         = 'anime';
  const PER_PAGE   = 12;

  // ─── THEME HANDLING ─────────────────────────────────────────────────────────
  function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    themeToggle.textContent = t === 'dark' ? '☀️' : '🌙';
  }
  themeToggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });
  applyTheme(localStorage.getItem('theme') || 'light');


  // ─── SIMPLE HASH ROUTER ─────────────────────────────────────────────────────
  window.addEventListener('hashchange', router);
  function router() {
    const [rawRoute, rawQs] = location.hash.slice(1).split('?');
    const [route, id]       = (rawRoute || '').split('/');
    const params            = new URLSearchParams(rawQs || '');

    if (!route || route === 'home') return showHome();
    if (route === 'search') {
      mode         = 'anime';
      currentQuery = params.get('q') || '';
      currentPage  = +params.get('page') || 1;
      return showResults(currentQuery, currentPage);
    }
    if (route === 'details' && id) {
      return showAnimeDetails(id, params.get('from') === 'home');
    }
    if (route === 'charsearch') {
      mode         = 'character';
      currentQuery = params.get('q') || '';
      currentPage  = +params.get('page') || 1;
      return showCharacterResults(currentQuery, currentPage);
    }
    if (route === 'chardetails' && id) {
      return showCharacterDetails(id, params.get('from') === 'home');
    }
    showHome();
  }


  // ─── UTILITY ─────────────────────────────────────────────────────────────────
  function clearApp() { app.innerHTML = ''; }
  function showError(msg) {
    clearApp();
    const node = tmpl.error.content.cloneNode(true);
    node.querySelector('#error-message').textContent = msg;
    app.appendChild(node);
  }


  // ─── HOME VIEW ───────────────────────────────────────────────────────────────
  async function showHome() {
    clearApp();
    app.appendChild(tmpl.home.content.cloneNode(true));

    const animeC = document.getElementById('popular-anime');
    const charC  = document.getElementById('popular-characters');

    for (let i = 0; i < 6; i++) {
      animeC.appendChild(tmpl.skeleton.content.cloneNode(true));
      charC.appendChild(tmpl.skeleton.content.cloneNode(true));
    }

    try {
      const [topA, topC] = await Promise.all([ fetchTopAnime(), fetchTopCharacters() ]);

      animeC.innerHTML = '';
      topA.results.forEach(a => animeC.appendChild(renderCard(a, false, true)));
      setupCarousel('popular-anime');

      charC.innerHTML = '';
      topC.results.forEach(c => charC.appendChild(renderCard(c, true, true)));
      setupCarousel('popular-characters');
    } catch (err) {
      showError(`Home load error: ${err.message}`);
    }
  }


  // ─── CAROUSEL NAVIGATION ────────────────────────────────────────────────────
  function setupCarousel(trackId) {
    const track = document.getElementById(trackId);
    const prev  = document.querySelector(`.carousel-btn.prev[data-target="${trackId}"]`);
    const next  = document.querySelector(`.carousel-btn.next[data-target="${trackId}"]`);

    [prev, next].forEach(btn => {
      btn.addEventListener('click', () => {
        const card = track.querySelector('.card');
        if (!card) return;
        const gap  = parseInt(getComputedStyle(track).gap) || 16;
        const dist = (card.offsetWidth + gap) * 3;
        track.scrollBy({ left: btn.classList.contains('prev') ? -dist : dist, behavior: 'smooth' });
      });
    });
  }


  // ─── SEARCH RESULTS VIEW ────────────────────────────────────────────────────
  async function showResults(q, page) {
    clearApp();
    app.appendChild(tmpl.results.content.cloneNode(true));

    const container = document.getElementById('results-container');
    const prevBtn   = document.getElementById('prev-page');
    const nextBtn   = document.getElementById('next-page');
    const pageInfo  = document.getElementById('page-info');

    for (let i = 0; i < PER_PAGE; i++) {
      container.appendChild(tmpl.skeleton.content.cloneNode(true));
    }

    try {
      const { results, hasMore } = await fetchAnimeList(q, page);
      container.innerHTML = '';

      if (!results.length) {
        container.innerHTML = '<p>No anime found.</p>';
      } else {
        results.forEach(a => container.appendChild(renderCard(a, false, false)));
      }

      pageInfo.textContent = `Page ${page}`;
      prevBtn.disabled     = page <= 1;
      nextBtn.disabled     = !hasMore;
      prevBtn.onclick      = () => navigateTo('search', q, page - 1);
      nextBtn.onclick      = () => navigateTo('search', q, page + 1);
    } catch (err) {
      showError(`Search failed: ${err.message}`);
    }
  }


  // ─── ANIME DETAILS VIEW ─────────────────────────────────────────────────────
  async function showAnimeDetails(id, fromHome = false) {
    clearApp();
    app.appendChild(tmpl.details.content.cloneNode(true));
    document.getElementById('back-btn').onclick = () => {
      if (fromHome) showHome();
      else navigateTo('search', currentQuery, currentPage);
    };

    const root = document.getElementById('anime-details');
    root.innerHTML = '<p>Loading…</p>';

    try {
      const info = await fetchAnimeDetails(id);
      root.innerHTML = '';

      const box = document.createElement('aside');
      box.className = 'infobox';
      const safe = v => v ?? 'N/A';
      box.innerHTML = `
        <h2>${info.title}</h2>
        <img src="${info.image_url}" alt="${info.title}" />
        <table>
          <tr><th>Type</th><td>${safe(info.type)}</td></tr>
          <tr><th>Episodes</th><td>${safe(info.episodes)}</td></tr>
          <tr><th>Score</th><td>${safe(info.score)}</td></tr>
          <tr><th>Aired</th><td>${info.aired?.string || 'N/A'}</td></tr>
          <tr>
            <th>Merch</th>
            <td>
              <a href="https://www.amazon.com/s?k=${encodeURIComponent(info.title)}" target="_blank" rel="noopener">
                Shop on Amazon
              </a>
            </td>
          </tr>
        </table>
      `;

      const content = document.createElement('div');
      content.className = 'wiki-content';

      const synopsisSection = document.createElement('section');
      synopsisSection.innerHTML = `<h2>Synopsis</h2>` +
        (info.synopsis
          ? info.synopsis.split(/\. +/).map(s => `<p>${s.trim()}.</p>`).join('')
          : `<p>No synopsis available.</p>`
        );
      content.appendChild(synopsisSection);

      const mkSec = (title, inner) => {
        const sec = document.createElement('section');
        sec.innerHTML = `<h2>${title}</h2>${inner}`;
        return sec;
      };
      if (info.genres?.length)   content.appendChild(mkSec('Genres', `<ul class="tag-list">${info.genres.map(g => `<li>${g.name}</li>`).join('')}</ul>`));
      if (info.background)       content.appendChild(mkSec('Background', `<p>${info.background}</p>`));
      if (info.studios?.length)  content.appendChild(mkSec('Studios', `<ul class="tag-list">${info.studios.map(s => `<li>${s.name}</li>`).join('')}</ul>`));

      const art = document.createElement('div');
      art.id = 'wiki-article';
      art.append(box, content);
      root.appendChild(art);

    } catch (err) {
      showError(`Details load error: ${err.message}`);
    }
  }


  // ─── CHARACTER VIEWS ────────────────────────────────────────────────────────
  async function showCharacterResults(q, page) {
    clearApp();
    app.appendChild(tmpl.results.content.cloneNode(true));

    const container = document.getElementById('results-container');
    const prevBtn   = document.getElementById('prev-page');
    const nextBtn   = document.getElementById('next-page');
    const pageInfo  = document.getElementById('page-info');
    for (let i = 0; i < PER_PAGE; i++) container.appendChild(tmpl.skeleton.content.cloneNode(true));

    try {
      const { results, hasMore } = await fetchCharacterList(q, page);
      container.innerHTML = '';
      if (!results.length) {
        container.innerHTML = '<p>No characters found.</p>';
      } else {
        results.forEach(ch => container.appendChild(renderCard(ch, true, false)));
      }

      pageInfo.textContent = `Page ${page}`;
      prevBtn.disabled     = page <= 1;
      nextBtn.disabled     = !hasMore;
      prevBtn.onclick      = () => navigateTo('charsearch', q, page - 1);
      nextBtn.onclick      = () => navigateTo('charsearch', q, page + 1);
    } catch (err) {
      showError(`Character search error: ${err.message}`);
    }
  }
  async function showCharacterDetails(id, fromHome = false) {
    clearApp();
    app.appendChild(tmpl.details.content.cloneNode(true));
    document.getElementById('back-btn').onclick = () => {
      if (fromHome) showHome();
      else navigateTo('charsearch', currentQuery, currentPage);
    };

    const root = document.getElementById('anime-details');
    root.innerHTML = '<p>Loading…</p>';

    try {
      const info = await fetchCharacterDetails(id);
      root.innerHTML = '';

      const box = document.createElement('aside');
      box.className = 'infobox';
      const safe = v => v ?? 'N/A';
      box.innerHTML = `
        <h2>${info.name}</h2>
        <img src="${info.image_url}" alt="${info.name}" />
        <table>
          <tr><th>Nicknames</th><td>${(info.nicknames||[]).join(', ')||'N/A'}</td></tr>
          <tr><th>Favorites</th><td>${safe(info.member_favorites)}</td></tr>
          <tr>
            <th>Merch</th>
            <td>
              <a href="https://www.amazon.com/s?k=${encodeURIComponent(info.name)}" target="_blank" rel="noopener">
                Shop on Amazon
              </a>
            </td>
          </tr>
        </table>
      `;

      const content = document.createElement('div');
      content.className = 'wiki-content';

      if (info.about) {
        const blocks = info.about.split(/\n\s*\n/).map(b => b.trim());
        const bioSec = document.createElement('section');
        bioSec.innerHTML = '<h2>Biography</h2>';
        blocks.forEach(block => {
          block.split('\n').forEach(line => {
            const [label, ...rest] = line.split(':');
            const txt = rest.join(':').trim();
            if (rest.length && !txt) return;
            if (rest.length) {
              const h3 = document.createElement('h3');
              h3.textContent = label.trim();
              const p  = document.createElement('p');
              p.textContent = txt;
              bioSec.appendChild(h3);
              bioSec.appendChild(p);
            } else {
              const p = document.createElement('p');
              p.textContent = line.trim();
              bioSec.appendChild(p);
            }
          });
        });
        content.appendChild(bioSec);
      }

      if (info.animeography?.length) {
        const sec = document.createElement('section');
        sec.innerHTML = '<h2>Animeography</h2><ul>' +
          info.animeography.map(a => `<li><a href="#details/${a.mal_id}">${a.name}</a> as ${a.role}</li>`).join('') +
          '</ul>';
        content.appendChild(sec);
      }
      if (info.mangaography?.length) {
        const sec = document.createElement('section');
        sec.innerHTML = '<h2>Mangaography</h2><ul>' +
          info.mangaography.map(m => `<li>${m.name} as ${m.role}</li>`).join('') +
          '</ul>';
        content.appendChild(sec);
      }
      if (info.voice_actors?.length) {
        const sec = document.createElement('section');
        sec.innerHTML = '<h2>Voice Actors</h2><ul>' +
          info.voice_actors.map(va => `<li>${va.language}: <a href="#chardetails/${va.person.mal_id}">${va.person.name}</a></li>`).join('') +
          '</ul>';
        content.appendChild(sec);
      }

      const art = document.createElement('div');
      art.id = 'wiki-article';
      art.append(box, content);
      root.appendChild(art);

    } catch (err) {
      showError(`Details load error: ${err.message}`);
    }
  }


  // ─── QUIZ LOGIC ──────────────────────────────────────────────────────────────
  const quizMap = {
    "00000":"Attack on Titan",
    "00001":"Naruto",
    "00010":"One Piece",
    "00011":"Fullmetal Alchemist: Brotherhood",
    "00100":"My Hero Academia",
    "00101":"Death Note",
    "00110":"Spice and Wolf",
    "00111":"Cowboy Bebop",
    "01000":"Steins;Gate",
    "01001":"Demon Slayer: Kimetsu no Yaiba",
    "01010":"Hunter x Hunter",
    "01011":"JoJo's Bizarre Adventure",
    "01100":"Code Geass",
    "01101":"Neon Genesis Evangelion",
    "01110":"Mob Psycho 100",
    "01111":"Haikyuu!!",
    "10000":"One Punch Man",
    "10001":"Fairy Tail",
    "10010":"Black Clover",
    "10011":"Dragon Ball Z",
    "10100":"Bleach",
    "10101":"Tokyo Ghoul",
    "10110":"Re:Zero – Starting Life in Another World",
    "10111":"The Rising of the Shield Hero",
    "11000":"Sword Art Online",
    "11001":"Trigun",
    "11010":"Gintama",
    "11011":"Fate/Zero",
    "11100":"Puella Magi Madoka Magica",
    "11101":"Clannad",
    "11110":"Your Lie in April",
    "11111":"The Promised Neverland"
  };

  document.getElementById('quiz-btn').addEventListener('click', showQuiz);

  function showQuiz() {
    clearApp();
    app.appendChild(tmpl.quiz.content.cloneNode(true));

    document.getElementById('quiz-back-btn').onclick = showHome;

    document.getElementById('quiz-form').onsubmit = async e => {
      e.preventDefault();
      const data = new FormData(e.target);
      let code = '';
      for (let i = 1; i <= 5; i++) code += data.get(`q${i}`);

      const title = quizMap[code];
      if (!title) {
        showError('No recommendation for that combination.');
        return;
      }

      clearApp();
      app.appendChild(Object.assign(document.createElement('section'), {
        className: 'view',
        innerHTML: '<p>Finding your recommendation…</p>'
      }));

      try {
        const { results } = await fetchAnimeList(title, 1);
        if (!results.length) showError(`Couldn’t find “${title}”.`);
        else location.hash = `#details/${results[0].mal_id}?from=home`;
      } catch (err) {
        showError(`Quiz failed: ${err.message}`);
      }
    };
  }


  // ─── FETCH HELPERS ──────────────────────────────────────────────────────────
  async function fetchTopAnime()          { return (await fetch('/api/top/anime?page=1')).json(); }
  async function fetchTopCharacters()     { return (await fetch('/api/top/characters?page=1')).json(); }
  async function fetchAnimeList(q, p)     { return (await fetch(`/api/anime?q=${encodeURIComponent(q)}&page=${p}`)).json(); }
  async function fetchAnimeDetails(id)    { return (await fetch(`/api/anime/${id}`)).json(); }
  async function fetchCharacterList(q, p) { return (await fetch(`/api/characters?q=${encodeURIComponent(q)}&page=${p}`)).json(); }
  async function fetchCharacterDetails(id){ return (await fetch(`/api/characters/${id}`)).json(); }


  // ─── CARD RENDERER ──────────────────────────────────────────────────────────
  function renderCard(item, isChar = false, fromHome = false) {
    const frag    = tmpl.card.content.cloneNode(true);
    const img     = frag.querySelector('.card-img');
    const titleEl = frag.querySelector('.card-title');
    const scoreEl = frag.querySelector('.card-score');
    const cardEl  = frag.querySelector('.card');

    img.src        = item.image_url;
    img.alt        = item.title || item.name;
    titleEl.textContent = item.title || item.name;
    scoreEl.textContent = isChar
      ? (item.about?.split('\n')[0] || '')
      : `★ ${item.score ?? 'N/A'}`;

    const btn = document.createElement('button');
    btn.className   = 'view-btn';
    btn.textContent = 'View Details';
    btn.onclick     = () => {
      const base = isChar ? 'chardetails' : 'details';
      location.hash = `#${base}/${item.mal_id}` + (fromHome ? '?from=home' : '');
    };
    cardEl.appendChild(btn);

    return frag;
  }


  // ─── NAVIGATE UTILITY ───────────────────────────────────────────────────────
  function navigateTo(route, q, p) {
    location.hash = `#${route}?q=${encodeURIComponent(q)}&page=${p}`;
  }


  // ─── LOGO CLICK RESET ───────────────────────────────────────────────────────
  document.getElementById('logo').onclick = () => {
    currentQuery = '';
    currentPage  = 1;
    mode         = 'anime';
    searchInput.value = '';
    modeSelect.value  = 'anime';
    location.hash      = '';  // go home
  };


  // ─── INITIAL SETUP ─────────────────────────────────────────────────────────
  searchBtn.addEventListener('click', () => {
    const q = searchInput.value.trim();
    if (!q) return;
    currentQuery = q; currentPage = 1;
    const route = modeSelect.value === 'character' ? 'charsearch' : 'search';
    navigateTo(route, q, 1);
  });
  searchInput.addEventListener('keyup', e => {
    if (e.key === 'Enter') searchBtn.click();
  });

  router();
})();