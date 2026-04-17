import React from "react";
import { useStore } from "../store";
import ChatPanel from "./panels/ChatPanel";
import FilesPanel from "./panels/FilesPanel";
import SearchPanel from "./panels/SearchPanel";

export default function SidePanel() {
  const { activeNav, panelOpen } = useStore();
  const hasSidePanel = ["chat","files","search"].includes(activeNav);
  const isOpen = hasSidePanel && panelOpen;

  return (
    <div className={`side-panel ${isOpen ? "" : "closed"}`}>
      {activeNav === "chat"   && <ChatPanel />}
      {activeNav === "files"  && <FilesPanel />}
      {activeNav === "search" && <SearchPanel />}
    </div>
  );
}
