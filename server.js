// server.js
require('dotenv').config();
const express = require('express');
const fetch   = require('node-fetch');    // v2.x
const cors    = require('cors');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));
// CORS only on /api
app.use('/api', cors());

// ─── Search Anime ─────────────────────────────────────────────────────────────
app.get('/api/anime', async (req, res) => {
  const { q = '', page = 1 } = req.query;
  const url = new URL('https://api.jikan.moe/v4/anime');
  url.searchParams.set('q', q);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', '12');
  url.searchParams.set('order_by', 'popularity');
  url.searchParams.set('sort', 'desc');
  try {
    const r = await fetch(url);
    const j = await r.json();
    return res.json({
      results: j.data.map(a => ({
        mal_id:    a.mal_id,
        title:     a.title,
        image_url: a.images.jpg.image_url,
        score:     a.score
      })),
      hasMore: j.pagination.has_next_page
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Anime Details ────────────────────────────────────────────────────────────
app.get('/api/anime/:id', async (req, res) => {
  try {
    const r = await fetch(`https://api.jikan.moe/v4/anime/${req.params.id}/full`);
    const { data } = await r.json();
    return res.json({
      ...data,
      image_url: data.images.jpg.large_image_url || data.images.jpg.image_url
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Search Characters ────────────────────────────────────────────────────────
app.get('/api/characters', async (req, res) => {
  const { q = '', page = 1 } = req.query;
  const url = new URL('https://api.jikan.moe/v4/characters');
  url.searchParams.set('q', q);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', '12');
  try {
    const r = await fetch(url);
    const j = await r.json();
    return res.json({
      results: j.data.map(c => ({
        mal_id:    c.mal_id,
        name:      c.name,
        image_url: c.images.jpg.image_url,
        about:     c.about?.split('\n')[0] || ''
      })),
      hasMore: j.pagination.has_next_page
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Character Details ────────────────────────────────────────────────────────
app.get('/api/characters/:id', async (req, res) => {
  try {
    const r = await fetch(`https://api.jikan.moe/v4/characters/${req.params.id}/full`);
    const { data } = await r.json();
    return res.json({
      ...data,
      image_url: data.images.jpg.large_image_url || data.images.jpg.image_url
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Top Anime ────────────────────────────────────────────────────────────────
app.get('/api/top/anime', async (req, res) => {
  const { page = 1 } = req.query;
  const url = new URL('https://api.jikan.moe/v4/top/anime');
  url.searchParams.set('page', page);
  try {
    const r = await fetch(url);
    const j = await r.json();
    return res.json({
      results: j.data.map(a => ({
        mal_id:    a.mal_id,
        title:     a.title,
        image_url: a.images.jpg.image_url,
        score:     a.score
      })),
      hasMore: j.pagination.has_next_page
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── Top Characters ───────────────────────────────────────────────────────────
app.get('/api/top/characters', async (req, res) => {
  const { page = 1 } = req.query;
  const url = new URL('https://api.jikan.moe/v4/top/characters');
  url.searchParams.set('page', page);
  try {
    const r = await fetch(url);
    const j = await r.json();
    return res.json({
      results: j.data.map(c => ({
        mal_id:    c.mal_id,
        name:      c.name,
        image_url: c.images.jpg.image_url,
        about:     c.about?.split('\n')[0] || ''
      })),
      hasMore: j.pagination.has_next_page
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// ─── SPA Fallback ─────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`AniWiki backend listening on http://localhost:${PORT}`);
});