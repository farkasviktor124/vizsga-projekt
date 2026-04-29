import React from "react";

export default function LoadingScreen({ username }) {
  return (
    <div className="loading-screen">
      <div className="crt-effect">
        <h1 className="retro-title">Üdvözlünk, {username}!</h1>
        <p className="retro-sub">Betöltés folyamatban...</p>
        <div className="retro-loader"></div>
      </div>
    </div>
  );
}