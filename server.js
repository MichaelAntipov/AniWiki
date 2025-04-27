// server.js
// ────────────────────────────────────────────────────────────────────────────
// Express backend for AniWiki: serves static files and proxies Jikan API calls.
// ────────────────────────────────────────────────────────────────────────────

require('dotenv').config();
const express = require('express');
const fetch   = require('node-fetch'); // Jikan v4
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Static Frontend ─────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ─── API CORS ────────────────────────────────────────────────────────────────
// Allow cross-origin for our own /api endpoints only.
app.use('/api', cors());


// ─── Search Anime ─────────────────────────────────────────────────────────────
// GET /api/anime?q=<query>&page=<n>
app.get('/api/anime', async (req, res) => {
  const { q = '', page = 1 } = req.query;
  const url = new URL('https://api.jikan.moe/v4/anime');
  url.searchParams.set('q', q);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', '12');

  try {
    const r = await fetch(url);
    const j = await r.json();
    res.json({
      results: j.data.map(a => ({
        mal_id:    a.mal_id,
        title:     a.title,
        image_url: a.images.jpg.image_url,
        score:     a.score
      })),
      hasMore: j.pagination.has_next_page
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ─── Anime Details ────────────────────────────────────────────────────────────
// GET /api/anime/:id
app.get('/api/anime/:id', async (req, res) => {
  try {
    const r = await fetch(`https://api.jikan.moe/v4/anime/${req.params.id}/full`);
    const { data } = await r.json();
    res.json({
      ...data,
      // prefer large image if available
      image_url: data.images.jpg.large_image_url || data.images.jpg.image_url
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ─── Search Characters ────────────────────────────────────────────────────────
// GET /api/characters?q=<query>&page=<n>
app.get('/api/characters', async (req, res) => {
  const { q = '', page = 1 } = req.query;
  const url = new URL('https://api.jikan.moe/v4/characters');
  url.searchParams.set('q', q);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', '12');

  try {
    const r = await fetch(url);
    const j = await r.json();
    res.json({
      results: j.data.map(c => ({
        mal_id:    c.mal_id,
        name:      c.name,
        image_url: c.images.jpg.image_url,
        about:     c.about?.split('\n')[0] || '' // just the first paragraph
      })),
      hasMore: j.pagination.has_next_page
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ─── Character Details ────────────────────────────────────────────────────────
// GET /api/characters/:id
app.get('/api/characters/:id', async (req, res) => {
  try {
    const r = await fetch(`https://api.jikan.moe/v4/characters/${req.params.id}/full`);
    const { data } = await r.json();
    res.json({
      ...data,
      image_url: data.images.jpg.large_image_url || data.images.jpg.image_url
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ─── Top Anime ────────────────────────────────────────────────────────────────
// GET /api/top/anime?page=<n>
app.get('/api/top/anime', async (req, res) => {
  const { page = 1 } = req.query;
  const url = new URL('https://api.jikan.moe/v4/top/anime');
  url.searchParams.set('page', page);

  try {
    const r = await fetch(url);
    const j = await r.json();
    res.json({
      results: j.data.map(a => ({
        mal_id:    a.mal_id,
        title:     a.title,
        image_url: a.images.jpg.image_url,
        score:     a.score
      })),
      hasMore: j.pagination.has_next_page
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ─── Top Characters ───────────────────────────────────────────────────────────
// GET /api/top/characters?page=<n>
app.get('/api/top/characters', async (req, res) => {
  const { page = 1 } = req.query;
  const url = new URL('https://api.jikan.moe/v4/top/characters');
  url.searchParams.set('page', page);

  try {
    const r = await fetch(url);
    const j = await r.json();
    res.json({
      results: j.data.map(c => ({
        mal_id:    c.mal_id,
        name:      c.name,
        image_url: c.images.jpg.image_url,
        about:     c.about?.split('\n')[0] || ''
      })),
      hasMore: j.pagination.has_next_page
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// ─── SPA Fallback ─────────────────────────────────────────────────────────────
// All other requests load index.html (client-side router handles it)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`👉  AniWiki backend listening on http://localhost:${PORT}`);
});