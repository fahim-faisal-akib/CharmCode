import React from "react";
import { useStore } from "../../store";

function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "just now";
  if (diff < 3600000) return Math.floor(diff/60000)+"m ago";
  if (diff < 86400000) return Math.floor(diff/3600000)+"h ago";
  return Math.floor(diff/86400000)+"d ago";
}

const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

export default function ChatPanel() {
  const { chats, activeChatId, newChat, selectChat, deleteChat } = useStore();

  return (
    <>
      <div className="panel-head">
        <span className="panel-head-title">Chats</span>
        <button className="btn btn-primary" style={{fontSize:12,padding:"4px 10px"}} onClick={newChat}>
          + New
        </button>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"6px"}}>
        {chats.length === 0 && (
          <div style={{padding:"20px 12px",textAlign:"center",fontSize:12,color:"var(--text-3)"}}>
            No chats yet.<br/>Click "+ New" to start.
          </div>
        )}

        {chats.map(chat => (
          <div key={chat.id}
            style={{
              display:"flex", alignItems:"center", gap:0,
              padding:"0 4px", borderRadius:"var(--r-sm)",
              background: activeChatId===chat.id ? "var(--bg-active)" : "transparent",
              marginBottom:2,
            }}
          >
            {/* Main clickable row */}
            <div
              style={{
                flex:1, display:"flex", flexDirection:"column",
                padding:"8px 6px", cursor:"pointer", minWidth:0,
              }}
              onClick={() => selectChat(chat.id)}
            >
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke={activeChatId===chat.id ? "var(--accent)" : "var(--text-3)"}
                  strokeWidth="2" style={{flexShrink:0}}>
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                <span style={{
                  fontSize:13, fontWeight: activeChatId===chat.id ? 500 : 400,
                  color: activeChatId===chat.id ? "var(--accent)" : "var(--text-1)",
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                }}>
                  {chat.title || "New chat"}
                </span>
              </div>
              <div style={{fontSize:11,color:"var(--text-3)",marginTop:2,paddingLeft:18}}>
                {chat.messages.length} msg{chat.messages.length!==1?"s":""} · {timeAgo(chat.createdAt)}
              </div>
            </div>

            {/* Delete button — always visible, red */}
            <button
              title="Delete chat"
              onClick={e => { e.stopPropagation(); deleteChat(chat.id); }}
              style={{
                flexShrink:0, width:28, height:28,
                display:"flex", alignItems:"center", justifyContent:"center",
                background:"transparent", border:"none", borderRadius:"var(--r-sm)",
                color:"var(--red)", cursor:"pointer", transition:"background 0.15s",
                opacity:0.7,
              }}
              onMouseEnter={e => { e.currentTarget.style.background="var(--red-bg)"; e.currentTarget.style.opacity=1; }}
              onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.opacity=0.7; }}
            >
              <TrashIcon />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
