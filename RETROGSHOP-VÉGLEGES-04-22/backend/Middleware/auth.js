{app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (!user || user.password !== password) return res.status(401).json({ success: false, error: "Hibás email vagy jelszó!" });
    res.json({ success: true, token: `token-${user.id}-${Date.now()}`, user: { id: user.id, username: user.username, email: user.email, role: user.role || 'user' } });
  });
});}

app.post("/api/register", (req, res) => {
  const { username, email, password } = req.body;
  db.get("SELECT id FROM users WHERE email = ?", [email], (err, existing) => {
    if (err) return res.status(500).json({ success: false, error: err.message });
    if (existing) return res.status(400).json({ success: false, error: "Az email már létezik!" });
    db.run("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')", [username, email, password], function(err){
      if(err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true, message: "Sikeres regisztráció!", user: { id: this.lastID, username, email, role: "user" } });
    });
  });
});