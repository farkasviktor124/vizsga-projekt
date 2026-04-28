// src/components/Register.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("A két jelszó nem egyezik!");
      return;
    }

    if (password.length < 6) {
      setError("A jelszónak legalább 6 karakter hosszúnak kell lennie!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:4000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess("Sikeres regisztráció! Átirányítás a bejelentkezéshez...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(data.error || "Regisztráció sikertelen!");
      }
    } catch (err) {
      console.error("Regisztrációs hiba:", err);
      setError("Hálózati hiba! Ellenőrizd, hogy fut-e a szerver.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "80vh"
    }}>
      <div style={{
        background: "#1a1a1a",
        border: "1px solid #66f0ff",
        borderRadius: "12px",
        padding: "40px",
        width: "100%",
        maxWidth: "400px"
      }}>
        <h2 style={{ color: "#a0f0ff", textAlign: "center", marginBottom: "24px" }}>
          Regisztráció
        </h2>

        {error && (
          <div style={{
            background: "#2a0000",
            border: "1px solid #ef4444",
            color: "#fca5a5",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            background: "#002a00",
            border: "1px solid #4caf50",
            color: "#a5fca5",
            padding: "10px",
            borderRadius: "6px",
            marginBottom: "16px",
            textAlign: "center"
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "#aaa", display: "block", marginBottom: "6px" }}>
              Felhasználónév
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="pl: Kovács Béla"
              required
              style={{
                width: "100%",
                padding: "10px",
                background: "#111",
                border: "1px solid #444",
                borderRadius: "6px",
                color: "white",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "#aaa", display: "block", marginBottom: "6px" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pelda@email.com"
              required
              style={{
                width: "100%",
                padding: "10px",
                background: "#111",
                border: "1px solid #444",
                borderRadius: "6px",
                color: "white",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "#aaa", display: "block", marginBottom: "6px" }}>
              Jelszó
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "10px",
                background: "#111",
                border: "1px solid #444",
                borderRadius: "6px",
                color: "white",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ color: "#aaa", display: "block", marginBottom: "6px" }}>
              Jelszó megerősítése
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: "100%",
                padding: "10px",
                background: "#111",
                border: "1px solid #444",
                borderRadius: "6px",
                color: "white",
                fontSize: "16px",
                boxSizing: "border-box"
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: loading ? "#555" : "#7c3aed",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            {loading ? "Regisztráció..." : "Regisztráció"}
          </button>
        </form>

        <p style={{ color: "#666", textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
          Már van fiókod?{" "}
          <span
            onClick={() => navigate("/login")}
            style={{ color: "#a78bfa", cursor: "pointer" }}
          >
            Bejelentkezés
          </span>
        </p>
      </div>
    </div>
  );
}

export default Register;