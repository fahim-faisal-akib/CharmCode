import React, { useState } from "react";
import { useStore } from "../store";

export default function ProjectsView() {
  const { projects, activeProjectId, addProject, deleteProject, selectProject } = useStore();
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !path.trim()) return;
    await addProject(name.trim(), path.trim());
    setName(""); setPath(""); setAdding(false);
  };

  return (
    <div style={{flex:1,overflowY:"auto",padding:"28px 32px",maxWidth:680}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <h1 style={{fontSize:20,fontWeight:700,color:"var(--text-1)",marginBottom:3}}>Projects</h1>
          <p style={{fontSize:13,color:"var(--text-3)"}}>Manage your project directories. The active project is used for all file operations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAdding(!adding)}>
          {adding ? "Cancel" : "+ Add Project"}
        </button>
      </div>

      {adding && (
        <div className="card" style={{marginBottom:20}}>
          <div className="sec-label">New Project</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <input type="text" placeholder="Project name (e.g. My App)"
              value={name} onChange={e=>setName(e.target.value)}/>
            <input type="text" placeholder="Absolute path (e.g. C:\Users\you\myapp or /home/you/myapp)"
              value={path} onChange={e=>setPath(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleAdd()}/>
            <div style={{display:"flex",gap:8}}>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!name.trim()||!path.trim()}>Add Project</button>
              <button className="btn btn-secondary" onClick={()=>{setAdding(false);setName("");setPath("");}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div style={{
          textAlign:"center",padding:"48px 24px",
          border:"2px dashed var(--border-hi)",borderRadius:"var(--r-lg)",
          color:"var(--text-3)",
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" style={{margin:"0 auto 10px",display:"block"}}>
            <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
          </svg>
          <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>No projects yet</div>
          <div style={{fontSize:13}}>Click "+ Add Project" to get started</div>
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {projects.map(p => {
            const isActive = p.id === activeProjectId;
            return (
              <div key={p.id} style={{
                display:"flex",alignItems:"center",gap:12,
                padding:"14px 16px",
                background:isActive?"var(--bg-active)":"var(--bg-surface)",
                border:`1px solid ${isActive?"var(--accent)":"var(--border)"}`,
                borderRadius:"var(--r-lg)",
                transition:"all 0.15s",
              }}>
                <div style={{
                  width:38,height:38,borderRadius:"var(--r)",flexShrink:0,
                  background:isActive?"var(--accent)":"var(--bg-elevated)",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  border:`1px solid ${isActive?"var(--accent)":"var(--border-hi)"}`,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive?"#fff":"var(--text-3)"} strokeWidth="1.8">
                    <path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
                  </svg>
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                    <span style={{fontSize:14,fontWeight:600,color:"var(--text-1)"}}>{p.name}</span>
                    {isActive && <span className="tag tag-blue" style={{fontSize:10}}>Active</span>}
                  </div>
                  <div style={{fontSize:12,color:"var(--text-3)",fontFamily:"var(--font-mono)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                    {p.path}
                  </div>
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  {!isActive && (
                    <button className="btn btn-secondary" style={{fontSize:12}} onClick={() => selectProject(p.id)}>
                      Set Active
                    </button>
                  )}
                  <button className="btn btn-danger" style={{fontSize:12}}
                    onClick={() => window.confirm(`Delete project "${p.name}"?`) && deleteProject(p.id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
