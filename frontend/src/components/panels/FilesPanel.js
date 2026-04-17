import React, { useEffect, useState } from "react";
import { useStore } from "../../store";

const EXT_ICON = {
  js:"🟨",jsx:"🟨",ts:"🔷",tsx:"🔷",py:"🐍",
  html:"🌐",css:"🎨",json:"📋",md:"📝",
  sh:"⚡",env:"🔒",txt:"📄",rs:"🦀",go:"🐹",
};

const TrashIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

function TreeNode({ node, depth, onSelect, selected }) {
  const [open, setOpen] = useState(depth < 1);
  const { deleteFile } = useStore();
  const pad = 8 + depth * 14;

  if (node.type === "dir") {
    return (
      <div>
        <div className="p-row" style={{paddingLeft:pad,gap:5,paddingRight:8}}
          onClick={() => setOpen(!open)}>
          <span style={{fontSize:9,color:"var(--text-3)",width:8,flexShrink:0}}>{open?"▾":"▸"}</span>
          <span style={{fontSize:13}}>📁</span>
          <span style={{fontSize:13,flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
            {node.name}
          </span>
        </div>
        {open && node.children?.map((c,i) =>
          <TreeNode key={i} node={c} depth={depth+1} onSelect={onSelect} selected={selected}/>
        )}
      </div>
    );
  }

  const ext = node.name.includes(".") ? node.name.split(".").pop().toLowerCase() : "";
  const icon = EXT_ICON[ext] || "📄";
  const isActive = selected === node.path;

  return (
    <div style={{
      display:"flex", alignItems:"center",
      paddingLeft: pad+14, paddingRight:4,
      borderRadius:"var(--r-sm)",
      background: isActive ? "var(--bg-active)" : "transparent",
      marginBottom:1,
    }}>
      <div style={{
        flex:1, display:"flex", alignItems:"center", gap:5,
        padding:"5px 4px 5px 0", cursor:"pointer", minWidth:0,
      }} onClick={() => onSelect(node.path)}>
        <span style={{fontSize:13,flexShrink:0}}>{icon}</span>
        <span style={{
          fontSize:13, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          color: isActive ? "var(--accent)" : "var(--text-2)",
          fontWeight: isActive ? 500 : 400,
        }}>
          {node.name}
        </span>
      </div>

      {/* Always visible red delete button */}
      <button
        title={`Delete ${node.name}`}
        onClick={e => {
          e.stopPropagation();
          if (window.confirm(`Delete "${node.name}"?`)) deleteFile(node.path);
        }}
        style={{
          flexShrink:0, width:22, height:22,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:"transparent", border:"none", borderRadius:4,
          color:"var(--red)", cursor:"pointer", opacity:0.65,
          transition:"all 0.15s",
        }}
        onMouseEnter={e => { e.currentTarget.style.background="var(--red-bg)"; e.currentTarget.style.opacity=1; }}
        onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.opacity=0.65; }}
      >
        <TrashIcon />
      </button>
    </div>
  );
}

export default function FilesPanel() {
  const { fileTree, loadFileTree, openFile, selectedFile, projectDir, createFile } = useStore();
  const [mode, setMode] = useState(null);
  const [newName, setNewName] = useState("");

  useEffect(() => { if (projectDir) loadFileTree(); }, [projectDir]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await createFile(newName.trim(), mode === "folder");
    setMode(null); setNewName("");
  };

  return (
    <>
      <div className="panel-head">
        <span className="panel-head-title">Files</span>
        <div style={{display:"flex",gap:4}}>
          <button className="btn-icon" title="New file"
            onClick={() => { setMode(mode==="file"?null:"file"); setNewName(""); }}
            style={{color: mode==="file" ? "var(--accent)" : undefined}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </button>
          <button className="btn-icon" title="New folder"
            onClick={() => { setMode(mode==="folder"?null:"folder"); setNewName(""); }}
            style={{color: mode==="folder" ? "var(--accent)" : undefined}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
              <line x1="12" y1="11" x2="12" y2="17"/>
              <line x1="9" y1="14" x2="15" y2="14"/>
            </svg>
          </button>
          <button className="btn-icon" title="Refresh" onClick={loadFileTree}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
          </button>
        </div>
      </div>

      {mode && (
        <div style={{padding:"8px 10px",borderBottom:"1px solid var(--border)",background:"var(--bg-elevated)"}}>
          <div style={{fontSize:11,color:"var(--text-3)",marginBottom:5}}>
            {mode==="file" ? "New file path (e.g. src/app.js)" : "New folder name"}
          </div>
          <div style={{display:"flex",gap:5}}>
            <input autoFocus type="text"
              placeholder={mode==="file" ? "filename.ext" : "foldername"}
              value={newName}
              onChange={e=>setNewName(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter") handleCreate(); if(e.key==="Escape") setMode(null); }}
              style={{fontSize:12,padding:"5px 8px"}}/>
            <button className="btn btn-primary" onClick={handleCreate}
              style={{fontSize:12,padding:"5px 10px",flexShrink:0}}>
              Create
            </button>
          </div>
        </div>
      )}

      {!projectDir ? (
        <div style={{padding:"20px 12px",textAlign:"center",fontSize:12,color:"var(--text-3)"}}>
          No project selected.<br/>Go to Projects to set one.
        </div>
      ) : (
        <div style={{flex:1,overflowY:"auto",padding:"6px 4px"}}>
          {!fileTree ? (
            <div style={{padding:"12px",fontSize:12,color:"var(--text-3)"}}>Loading…</div>
          ) : !fileTree.children?.length ? (
            <div style={{padding:"12px",fontSize:12,color:"var(--text-3)"}}>Empty project</div>
          ) : (
            fileTree.children.map((c,i) =>
              <TreeNode key={i} node={c} depth={0} onSelect={openFile} selected={selectedFile}/>
            )
          )}
        </div>
      )}
    </>
  );
}
