const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS markers (
      id SERIAL PRIMARY KEY,
      lat DOUBLE PRECISION NOT NULL,
      lng DOUBLE PRECISION NOT NULL,
      popup TEXT NOT NULL
    )
  `);
  const { rows } = await pool.query('SELECT COUNT(*) FROM markers');
  if (parseInt(rows[0].count) === 0) {
    const seed = require('./markers.json');
    for (const m of seed) {
      await pool.query('INSERT INTO markers (lat, lng, popup) VALUES ($1, $2, $3)',
        [m.geocode[0], m.geocode[1], m.popup]);
    }
    console.log(`Seeded ${seed.length} markers from markers.json`);
  }
}

initDb().catch(console.error);

app.get('/markers', async (req, res) => {
  const { rows } = await pool.query('SELECT lat, lng, popup FROM markers ORDER BY id');
  res.json(rows.map(r => ({ geocode: [r.lat, r.lng], popup: r.popup })));
});

app.post('/admin', async (req, res) => {
  const { latitude, longitude, popup } = req.body;
  await pool.query('INSERT INTO markers (lat, lng, popup) VALUES ($1, $2, $3)',
    [parseFloat(latitude), parseFloat(longitude), popup]);
  res.json({ success: true });
});

// Serve React build in production
const buildPath = path.join(__dirname, 'my-app/build');
console.log('Build folder exists:', require('fs').existsSync(buildPath));
app.use(express.static(buildPath));
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'my-app/build', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`listening on port ${PORT}`));