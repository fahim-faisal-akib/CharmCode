import React, { useEffect } from "react";
import { useStore } from "./store";
import NavBar from "./components/NavBar";
import SidePanel from "./components/SidePanel";
import ChatView from "./views/ChatView";
import FilesView from "./views/FilesView";
import ProjectsView from "./views/ProjectsView";
import SettingsView from "./views/SettingsView";
import "./App.css";

export default function App() {
  const { activeNav, loadSettings, saveFile, fileModified } = useStore();

  useEffect(() => { loadSettings(); }, []);

  // Global Ctrl+S to save current file
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (fileModified) saveFile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [fileModified, saveFile]);

  return (
    <div className="shell">
      <NavBar />
      <SidePanel />
      <main className="main-area">
        {activeNav === "chat"     && <ChatView />}
        {activeNav === "files"    && <FilesView />}
        {activeNav === "projects" && <ProjectsView />}
        {activeNav === "settings" && <SettingsView />}
        {activeNav === "search"   && <ChatView />}
      </main>
    </div>
  );
}
