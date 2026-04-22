const express = require("express");
const router = express.Router();
const db = require("../database");

// GET users
router.get("/users", (req, res) => {
  db.all("SELECT id, username, email, role, type FROM users", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    res.json(rows);
  });
});

// DELETE user
router.delete("/users/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ success: true });
  });
});

// STATUS váltás
router.put("/users/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  db.run("UPDATE users SET type = ? WHERE id = ?", [status, id], function (err) {
    if (err) return res.status(500).json({ error: err.message });

    res.json({ success: true });
  });
});

module.exports = router;