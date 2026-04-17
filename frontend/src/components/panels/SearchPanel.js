import React, { useState, useMemo } from "react";
import { useStore } from "../../store";

export default function SearchPanel() {
  const { chats, selectChat, setActiveNav } = useStore();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches = [];
    for (const chat of chats) {
      // Match on title
      if (chat.title?.toLowerCase().includes(q)) {
        matches.push({ chat, matchType:"title", snippet: chat.title });
        continue;
      }
      // Match on message content
      for (const msg of chat.messages) {
        if (typeof msg.content === "string" && msg.content.toLowerCase().includes(q)) {
          const idx = msg.content.toLowerCase().indexOf(q);
          const start = Math.max(0, idx - 30);
          const snippet = (start > 0 ? "…" : "") +
            msg.content.slice(start, idx + q.length + 60) +
            (idx + q.length + 60 < msg.content.length ? "…" : "");
          matches.push({ chat, matchType: msg.role, snippet });
          break;
        }
      }
    }
    return matches.slice(0, 40);
  }, [query, chats]);

  const open = (chatId) => {
    selectChat(chatId);
    setActiveNav("chat");
  };

  // Highlight matching text
  const highlight = (text) => {
    if (!query.trim()) return text;
    const q = query.toLowerCase();
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark style={{background:"var(--amber-bg)",color:"var(--amber)",borderRadius:2,padding:"0 1px"}}>
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <>
      <div className="panel-head">
        <span className="panel-head-title">Search chats</span>
      </div>

      <div style={{padding:"8px 10px",borderBottom:"1px solid var(--border)"}}>
        <div style={{position:"relative"}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2"
            style={{position:"absolute",left:9,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            autoFocus
            type="text"
            placeholder="Search messages…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{paddingLeft:30,fontSize:13}}
          />
        </div>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:"6px"}}>
        {!query.trim() && (
          <div style={{padding:"16px 10px",fontSize:12,color:"var(--text-3)",textAlign:"center"}}>
            Type to search across all chats
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div style={{padding:"16px 10px",fontSize:12,color:"var(--text-3)",textAlign:"center"}}>
            No results for "{query}"
          </div>
        )}

        {results.map((r, i) => (
          <div key={i}
            onClick={() => open(r.chat.id)}
            style={{
              padding:"8px 10px", marginBottom:2,
              borderRadius:"var(--r-sm)", cursor:"pointer",
              border:"1px solid var(--border)",
              background:"var(--bg-surface)",
              transition:"background 0.1s",
            }}
            onMouseEnter={e => e.currentTarget.style.background="var(--bg-hover)"}
            onMouseLeave={e => e.currentTarget.style.background="var(--bg-surface)"}
          >
            <div style={{fontSize:12,fontWeight:500,color:"var(--text-1)",marginBottom:3,
              overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
              {highlight(r.chat.title || "New chat")}
            </div>
            <div style={{fontSize:11,color:"var(--text-3)",lineHeight:1.5,
              overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>
              <span style={{
                color: r.matchType==="user" ? "var(--accent)" : r.matchType==="assistant" ? "var(--green)" : "var(--text-3)",
                marginRight:4, fontSize:10,
              }}>
                {r.matchType==="user" ? "you" : r.matchType==="assistant" ? "ai" : "title"}
              </span>
              {highlight(r.snippet)}
            </div>
          </div>
        ))}

        {results.length > 0 && (
          <div style={{fontSize:11,color:"var(--text-3)",textAlign:"center",padding:"8px"}}>
            {results.length} result{results.length!==1?"s":""}
          </div>
        )}
      </div>
    </>
  );
}
