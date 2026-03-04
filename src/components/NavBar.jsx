import React from "react";
import { Link } from "react-router-dom";

export default function NavBar() {
  return (
    <div className="navbar bg-base-300 px-4 shadow-md">
      <div className="flex-none gap-2">
        <Link to="/" className="btn btn-ghost btn-sm">
          Home
        </Link>
        <Link to="/termekek" className="btn btn-ghost btn-sm">
          Termékek
        </Link>
        <Link to="/termekfelvitel" className="btn btn-ghost btn-sm">
          Termék felvétele
        </Link>  
       
      </div>
    </div>
  );
}