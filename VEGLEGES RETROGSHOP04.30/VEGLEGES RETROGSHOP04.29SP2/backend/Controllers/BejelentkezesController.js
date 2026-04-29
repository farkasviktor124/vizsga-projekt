const db = require('../database');

exports.login = (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ?", [username], (err, user) => {
    if (err) return res.status(500).json({ success: false, error: err.message });

    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, error: "Hibás email vagy jelszó!" });
    }

    res.json({
      success: true,
      token: `token-${user.id}-${Date.now()}`,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user'
      }
    });
  });
};