import { useState } from "react";
import { useNavigate } from "react-router-dom";

function TermekFelvitel() {
  const [nev, setNev] = useState("");
  const [ar, setAr] = useState("");
  const [allapot, setAllapot] = useState("");
  const [evjarat, setEvjarat] = useState("");
  const [gyarto, setGyarto] = useState("");
  const [arus, setArus] = useState("");
  const [kep, setKep] = useState(""); // <-- ÚJ: kép URL

  const navigate = useNavigate();

  const kuldes = async () => {
    try {
      const response = await fetch("http://localhost:4000/termekek", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nev, ar, allapot, evjarat, gyarto, arus, kep }),
      });

      const data = await response.json();
      alert(data.message);
      navigate("/");
    } catch (error) {
      console.error("HIBA:", error);
      alert(error);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    kuldes();
  };

  return (
    <form onSubmit={onSubmit}>
      <input placeholder="Név" value={nev} onChange={e => setNev(e.target.value)} />
      <input placeholder="Ár" value={ar} onChange={e => setAr(e.target.value)} />
      <input placeholder="Állapot" value={allapot} onChange={e => setAllapot(e.target.value)} />
      <input placeholder="Évjárat" value={evjarat} onChange={e => setEvjarat(e.target.value)} />
      <input placeholder="Gyártó" value={gyarto} onChange={e => setGyarto(e.target.value)} />
      <input placeholder="Árus" value={arus} onChange={e => setArus(e.target.value)} />

      {/* ÚJ: kép URL mező */}
      <input
        placeholder="Kép URL (pl. https://...)"
        value={kep}
        onChange={e => setKep(e.target.value)}
      />

      <button type="submit">Mentés</button>
    </form>
  );
}

export default TermekFelvitel;