import { useState } from "react";

export default function Regisztráció() {
  const [showAuth, setShowAuth] = useState(false);

  function openModal() {
    setShowAuth(true);
  }

  function closeModal() {
    setShowAuth(false);
  }

  function handleRegister(e) {
    e.preventDefault();

    const formData = new FormData(e.target);

    fetch("api/register.php", {
      method: "POST",
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert("Sikeres regisztráció");
          setShowAuth(false); // modal eltűnik
        } else {
          alert(data.message || "Hiba történt");
        }
      });
  }

  return (
    <>
      {/* Gomb a modal megnyitásához */}
      <button onClick={openModal}>Regisztráció</button>

      {/* MODAL JSX-ben */}
      {showAuth && (
        <div id="authModal" className="modal">
          <div className="modalContent">

            {/* Bezáró gomb */}
            <button id="closeAuth" onClick={closeModal}>X</button>

            <h2>Regisztráció</h2>

            <form onSubmit={handleRegister}>
              <input type="text" name="username" placeholder="Felhasználónév" required />
              <input type="password" name="password" placeholder="Jelszó" required />
              <button type="submit">Regisztráció</button>
            </form>

          </div>
        </div>
      )}
    </>
  );
}