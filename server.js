/**
 * ENSIT Junior Entreprise — Backend Gestion Qualité
 * Stack : Node.js + Express + PostgreSQL
 * Lancer : node server.js
 */

const express = require("express");
const cors    = require("cors");
const { Pool } = require("pg");

const PORT       = process.env.PORT || 3000;
const ADMIN_PASS = process.env.ADMIN_PASSWORD || "ensit2024";

// ─── PostgreSQL ────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// ─── Init tables ──────────────────────────────────────────
async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS nc (
      id          TEXT PRIMARY KEY,
      data        JSONB NOT NULL,
      submitted_by TEXT NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS recl (
      id          TEXT PRIMARY KEY,
      data        JSONB NOT NULL,
      submitted_by TEXT NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS act (
      id          TEXT PRIMARY KEY,
      data        JSONB NOT NULL,
      submitted_by TEXT NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS counters (
      key TEXT PRIMARY KEY,
      val INTEGER DEFAULT 0
    );
    INSERT INTO counters (key, val) VALUES ('fnc',0),('recl',0),('act',0)
    ON CONFLICT (key) DO NOTHING;
  `);
  console.log("✅ Tables prêtes.");
}

// ─── Utilitaires ──────────────────────────────────────────
async function nextId(prefix) {
  const key = prefix.toLowerCase();
  const r = await pool.query(
    "UPDATE counters SET val = val + 1 WHERE key=$1 RETURNING val",
    [key]
  );
  return `${prefix}-${String(r.rows[0].val).padStart(3,"0")}`;
}

function isAdmin(req) {
  return req.headers["x-admin-password"] === ADMIN_PASS;
}
function requireAdmin(req, res, next) {
  if (!isAdmin(req)) return res.status(403).json({ error: "Accès refusé." });
  next();
}

// ─── App ───────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json());

// Ping
app.get("/api/ping", (req, res) => res.json({ ok: true }));

// Auth
app.post("/api/auth", (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASS) return res.json({ ok: true, role: "admin" });
  return res.json({ ok: true, role: "user" });
});

// ══════════════════════════════════════════════════════════
// NON-CONFORMITÉS
// ══════════════════════════════════════════════════════════

// GET — admin : toutes | user : les siennes
app.get("/api/nc", async (req, res) => {
  try {
    let r;
    if (isAdmin(req)) {
      r = await pool.query("SELECT id, data, submitted_by, submitted_at FROM nc ORDER BY submitted_at DESC");
    } else {
      const user = req.headers["x-user"] || "";
      r = await pool.query("SELECT id, data, submitted_by, submitted_at FROM nc WHERE submitted_by=$1 ORDER BY submitted_at DESC", [user]);
    }
    res.json(r.rows.map(row => ({ ...row.data, id: row.id, submittedBy: row.submitted_by, submittedAt: row.submitted_at })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST — utilisateurs seulement
app.post("/api/nc", async (req, res) => {
  try {
    const user = req.headers["x-user"] || "";
    const id   = await nextId("FNC");
    const data = { ...req.body, id, submittedBy: user };
    await pool.query("INSERT INTO nc (id, data, submitted_by) VALUES ($1,$2,$3)", [id, data, user]);
    res.status(201).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH statut — admin seulement
app.patch("/api/nc/:id", requireAdmin, async (req, res) => {
  try {
    const r = await pool.query("SELECT data FROM nc WHERE id=$1", [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: "Non trouvé" });
    const updated = { ...r.rows[0].data, ...req.body };
    await pool.query("UPDATE nc SET data=$1 WHERE id=$2", [updated, req.params.id]);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE — admin seulement
app.delete("/api/nc/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM nc WHERE id=$1", [req.params.id]);
    res.json({ deleted: req.params.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// RÉCLAMATIONS
// ══════════════════════════════════════════════════════════

app.get("/api/recl", async (req, res) => {
  try {
    let r;
    if (isAdmin(req)) {
      r = await pool.query("SELECT id, data, submitted_by, submitted_at FROM recl ORDER BY submitted_at DESC");
    } else {
      const user = req.headers["x-user"] || "";
      r = await pool.query("SELECT id, data, submitted_by, submitted_at FROM recl WHERE submitted_by=$1 ORDER BY submitted_at DESC", [user]);
    }
    res.json(r.rows.map(row => ({ ...row.data, id: row.id, submittedBy: row.submitted_by, submittedAt: row.submitted_at })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/recl", async (req, res) => {
  try {
    const user = req.headers["x-user"] || "";
    const id   = await nextId("RECL");
    const data = { ...req.body, id, submittedBy: user };
    await pool.query("INSERT INTO recl (id, data, submitted_by) VALUES ($1,$2,$3)", [id, data, user]);
    res.status(201).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch("/api/recl/:id", requireAdmin, async (req, res) => {
  try {
    const r = await pool.query("SELECT data FROM recl WHERE id=$1", [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: "Non trouvé" });
    const updated = { ...r.rows[0].data, ...req.body };
    await pool.query("UPDATE recl SET data=$1 WHERE id=$2", [updated, req.params.id]);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/recl/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM recl WHERE id=$1", [req.params.id]);
    res.json({ deleted: req.params.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════
// ACTIONS D'AMÉLIORATION — admin seulement
// ══════════════════════════════════════════════════════════

app.get("/api/act", requireAdmin, async (req, res) => {
  try {
    const r = await pool.query("SELECT id, data, submitted_by, submitted_at FROM act ORDER BY submitted_at DESC");
    res.json(r.rows.map(row => ({ ...row.data, id: row.id, submittedBy: row.submitted_by, submittedAt: row.submitted_at })));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/act", requireAdmin, async (req, res) => {
  try {
    const user = req.headers["x-user"] || "";
    const id   = await nextId("ACT");
    const data = { ...req.body, id, submittedBy: user };
    await pool.query("INSERT INTO act (id, data, submitted_by) VALUES ($1,$2,$3)", [id, data, user]);
    res.status(201).json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch("/api/act/:id", requireAdmin, async (req, res) => {
  try {
    const r = await pool.query("SELECT data FROM act WHERE id=$1", [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: "Non trouvé" });
    const updated = { ...r.rows[0].data, ...req.body };
    await pool.query("UPDATE act SET data=$1 WHERE id=$2", [updated, req.params.id]);
    res.json(updated);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/act/:id", requireAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM act WHERE id=$1", [req.params.id]);
    res.json({ deleted: req.params.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Démarrage ─────────────────────────────────────────────
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`\n🚀 ENSIT QMS Backend — port ${PORT}`);
    console.log(`   Ping : http://localhost:${PORT}/api/ping\n`);
  });
}).catch(e => {
  console.error("❌ Erreur connexion base de données :", e.message);
  process.exit(1);
});
