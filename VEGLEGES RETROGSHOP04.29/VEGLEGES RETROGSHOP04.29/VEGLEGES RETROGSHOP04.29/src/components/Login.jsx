import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:4000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // User és token mentése localStorage-ba
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token);

        console.log("Bejelentkezve:", data.user);

        // Admin → admin panel, User → főoldal
        if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/termekek");
        }
      } else {
        setError(data.error || "Hibás email vagy jelszó!");
      }
    } catch (err) {
      console.error("Bejelentkezési hiba:", err);
      setError("Hálózati hiba! Ellenőrizd hogy fut-e a szerver.");
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
        border: "1px solid #333",
        borderRadius: "12px",
        padding: "40px",
        width: "100%",
        maxWidth: "400px"
      }}>
        <h2 style={{ color: "white", textAlign: "center", marginBottom: "24px" }}>
          Bejelentkezés
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

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "#aaa", display: "block", marginBottom: "6px" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@admin.com"
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
            {loading ? "Bejelentkezés..." : "Bejelentkezés"}
          </button>
        </form>

        <p style={{ color: "#666", textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
          Nincs fiókod?{" "}
          <span
            onClick={() => navigate("/register")}
            style={{ color: "#a78bfa", cursor: "pointer" }}
          >
            Regisztráció
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;