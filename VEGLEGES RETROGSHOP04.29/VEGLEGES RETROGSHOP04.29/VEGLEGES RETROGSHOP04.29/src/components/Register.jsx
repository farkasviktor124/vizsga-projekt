
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
  const [jelszoEro, setJelszoEro] = useState("");
  const [jelszoSzin, setJelszoSzin] = useState("");
  const [elfelejtettModal, setElfelejtettModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetUzenet, setResetUzenet] = useState("");
  const navigate = useNavigate();

  // Jelszó erősség ellenőrzése
  const ellenorizJelszo = (jelszo) => {
    setPassword(jelszo);
    
    let eros = 0;
    if (jelszo.length >= 8) eros++;
    if (jelszo.match(/[A-Z]/)) eros++;
    if (jelszo.match(/[0-9]/)) eros++;
    if (jelszo.match(/[^a-zA-Z0-9]/)) eros++;
    
    if (jelszo.length === 0) {
      setJelszoEro("");
      setJelszoSzin("");
    } else if (eros <= 1) {
      setJelszoEro("Gyenge");
      setJelszoSzin("#ef4444");
    } else if (eros === 2) {
      setJelszoEro("Közepes");
      setJelszoSzin("#f59e0b");
    } else if (eros >= 3) {
      setJelszoEro("Erős");
      setJelszoSzin("#22c55e");
    }
  };

  // Elfelejtett jelszó kezelés
  const kezelElfelejtett = async () => {
    if (!resetEmail) {
      setResetUzenet("Kérlek add meg az email címed!");
      return;
    }
    
    setResetUzenet("Küldés folyamatban...");
    
    try {
      const response = await fetch("http://localhost:4000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResetUzenet("Jelszó visszaállító link elküldve az email címedre!");
        setTimeout(() => {
          setElfelejtettModal(false);
          setResetEmail("");
          setResetUzenet("");
        }, 3000);
      } else {
        setResetUzenet(data.error || "Hiba történt, próbáld újra!");
      }
    } catch (err) {
      setResetUzenet("Hálózati hiba, próbáld később!");
    }
  };

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
      setError("Hálózati hiba! Ellenőrizd, hogy fut-e a szerver.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
          maxWidth: "450px"
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
                onChange={(e) => ellenorizJelszo(e.target.value)}
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
              {jelszoEro && (
                <div style={{ marginTop: "8px", fontSize: "12px", color: jelszoSzin }}>
                  Jelszó erősség: <strong>{jelszoEro}</strong>
                  <br />
                  <span style={{ fontSize: "10px", color: "#666" }}>
                    {jelszoEro === "Gyenge" && "Használj nagybetűt, számot vagy speciális karaktert!"}
                    {jelszoEro === "Közepes" && "Még egy speciális karakter erősebbé teheti!"}
                    {jelszoEro === "Erős" && "Remek jelszó, így tovább!"}
                  </span>
                </div>
              )}
            </div>

            <div style={{ marginBottom: "16px" }}>
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

          <p style={{ color: "#666", textAlign: "center", marginTop: "15px", fontSize: "14px" }}>
            Már van fiókod?{" "}
            <span
              onClick={() => navigate("/login")}
              style={{ color: "#a78bfa", cursor: "pointer" }}
            >
              Bejelentkezés
            </span>
          </p>

          <p style={{ textAlign: "center", marginTop: "10px" }}>
            <span
              onClick={() => setElfelejtettModal(true)}
              style={{ color: "#f59e0b", cursor: "pointer", fontSize: "13px" }}
            >
              Elfelejtetted a jelszavad?
            </span>
          </p>
        </div>
      </div>

      {/* Elfelejtett jelszó modal */}
      {elfelejtettModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: "#1a1a1a",
            border: "1px solid #66f0ff",
            borderRadius: "12px",
            padding: "30px",
            width: "350px",
            maxWidth: "90%"
          }}>
            <h3 style={{ color: "#a0f0ff", marginBottom: "20px", textAlign: "center" }}>
              Jelszó visszaállítás
            </h3>
            
            <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "20px", textAlign: "center" }}>
              Add meg az email címed, és küldünk egy linket a jelszó visszaállításához.
            </p>
            
            <input
              type="email"
              placeholder="pelda@email.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                background: "#111",
                border: "1px solid #444",
                borderRadius: "6px",
                color: "white",
                fontSize: "14px",
                marginBottom: "20px",
                boxSizing: "border-box"
              }}
            />
            
            {resetUzenet && (
              <div style={{
                background: resetUzenet.includes("sikeres") ? "#002a00" : "#2a0000",
                border: `1px solid ${resetUzenet.includes("sikeres") ? "#4caf50" : "#ef4444"}`,
                color: resetUzenet.includes("sikeres") ? "#a5fca5" : "#fca5a5",
                padding: "8px",
                borderRadius: "6px",
                marginBottom: "20px",
                fontSize: "12px",
                textAlign: "center"
              }}>
                {resetUzenet}
              </div>
            )}
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => {
                  setElfelejtettModal(false);
                  setResetEmail("");
                  setResetUzenet("");
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#333",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Mégse
              </button>
              <button
                onClick={kezelElfelejtett}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#7c3aed",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Küldés
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Register;