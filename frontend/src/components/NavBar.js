import React, { useState } from "react";
import { useStore } from "../store";

const Icon = ({ d, size=18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d={d}/>
  </svg>
);

const ICONS = {
  search:   "M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z",
  chat:     "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  files:    "M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z",
  projects: "M4 6h16M4 12h16M4 18h7",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
};

const TOP_NAV = ["search","chat","files","projects"];

export default function NavBar() {
  const { activeNav, setActiveNav, chats } = useStore();
  const hasChats = chats.length > 0;

  return (
    <nav className="nav-bar">
      <div className="nav-logo">O</div>

      {TOP_NAV.map(id => (
        <button key={id}
          title={id.charAt(0).toUpperCase()+id.slice(1)}
          className={`nav-btn ${activeNav===id ? "active" : ""}`}
          onClick={() => setActiveNav(id)}
        >
          <Icon d={ICONS[id]} />
          {id==="chat" && hasChats && activeNav!=="chat" && <span className="badge-dot"/>}
        </button>
      ))}

      <span className="nav-spacer"/>

      <button title="Settings"
        className={`nav-btn ${activeNav==="settings" ? "active" : ""}`}
        onClick={() => setActiveNav("settings")}
      >
        <Icon d={ICONS.settings} />
      </button>
    </nav>
  );
}
