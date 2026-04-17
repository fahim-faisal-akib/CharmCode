import React, { useState, useRef, useEffect } from "react";
import { useStore } from "../store";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

const ACTION_META = {
  create_file: { icon:"✦", label:"Created",  color:"var(--green)" },
  edit_file:   { icon:"✎", label:"Edited",   color:"var(--accent-hi)" },
  create_dir:  { icon:"⊞", label:"Folder",   color:"var(--purple)" },
  delete_file: { icon:"✕", label:"Deleted",  color:"var(--red)" },
};

function ActionChip({ action }) {
  const m = ACTION_META[action.type] || { icon:"•", label:action.type, color:"var(--text-2)" };
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",gap:4,
      padding:"2px 8px",borderRadius:4,marginRight:5,marginBottom:4,
      background:"var(--bg-elevated)",border:`1px solid var(--border-hi)`,
      fontSize:11,fontFamily:"var(--font-mono)",color:m.color,
    }}>
      {m.icon} <span style={{color:"var(--text-2)"}}>{m.label}:</span> {action.path}
    </span>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  const theme = useStore(s => s.theme);
  const codeTheme = theme === "light" ? oneLight : vscDarkPlus;

  return (
    <div className={`msg-row ${isUser ? "user" : "ai"}`}>
      {!isUser && (
        <div className="avatar ai">AI</div>
      )}
      <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:0}}>
        {msg.thought && !isUser && (
          <div style={{fontSize:12,color:"var(--text-3)",fontStyle:"italic",padding:"4px 10px",borderLeft:"2px solid var(--border-hi)",marginBottom:2}}>
            {msg.thought}
          </div>
        )}
        {msg.actions?.length > 0 && (
          <div style={{display:"flex",flexWrap:"wrap",marginBottom:4}}>
            {msg.actions.map((a,i) => <ActionChip key={i} action={a}/>)}
          </div>
        )}
        <div className="bubble">
          {isUser ? (
            <span style={{whiteSpace:"pre-wrap"}}>{msg.content}</span>
          ) : (
            <div className="md" style={{color:msg.isError?"var(--red)":undefined}}>
              <ReactMarkdown components={{
                code({inline,className,children,...props}) {
                  const lang = (className||"").replace("language-","");
                  if (!inline && lang) return (
                    <SyntaxHighlighter language={lang} style={codeTheme} PreTag="div" {...props}>
                      {String(children).replace(/\n$/,"")}
                    </SyntaxHighlighter>
                  );
                  return <code {...props}>{children}</code>;
                }
              }}>
                {msg.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && (msg.model || msg.provider) && (
          <div style={{fontSize:10,color:"var(--text-3)",fontFamily:"var(--font-mono)",display:"flex",gap:8,paddingLeft:2}}>
            {msg.provider && <span className={`tag ${msg.provider==="groq"?"tag-purple":"tag-blue"}`} style={{fontSize:9}}>{msg.provider}</span>}
            {msg.model && <span>{msg.model.split("/").pop()}</span>}
            {msg.usage && <span>{msg.usage.prompt_tokens}↑ {msg.usage.completion_tokens}↓</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function Thinking() {
  return (
    <div className="msg-row ai">
      <div className="avatar ai">AI</div>
      <div className="bubble" style={{display:"flex",alignItems:"center",gap:5,padding:"12px 15px"}}>
        {[0,1,2].map(i => (
          <div key={i} className="thinking-dot" style={{animationDelay:`${i*0.2}s`}}/>
        ))}
      </div>
    </div>
  );
}

export default function ChatView() {
  const {
    chats, activeChatId, isThinking, sendMessage, newChat,
    activeModel, activeProvider, projectDir, lastKeyUsed,
    openrouterModels, groqModels, setActiveModel,
  } = useStore();

  const [input, setInput] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const bottomRef = useRef(null);
  const taRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId);
  const messages = activeChat?.messages || [];
  const allModels = [
    ...openrouterModels.map(m => ({...m,provider:"openrouter"})),
    ...groqModels.map(m => ({...m,provider:"groq"})),
  ];

  useEffect(() => { bottomRef.current?.scrollIntoView({behavior:"smooth"}); }, [messages.length, isThinking]);

  const send = () => {
    if (!input.trim() || isThinking) return;
    if (!activeChatId) newChat();
    sendMessage(input);
    setInput("");
    taRef.current?.focus();
  };

  const projectName = projectDir ? projectDir.split(/[/\\]/).pop() : null;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh"}}>
      {/* Top bar */}
      <div style={{
        padding:"0 16px", height:48,
        borderBottom:"1px solid var(--border)",
        background:"var(--bg-surface)",
        display:"flex",alignItems:"center",justifyContent:"space-between",
        flexShrink:0,
      }}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontWeight:600,fontSize:14,color:"var(--text-1)"}}>
            {activeChat?.title || "Chat"}
          </span>
          {projectName && (
            <span style={{
              fontSize:11,color:"var(--text-3)",fontFamily:"var(--font-mono)",
              display:"flex",alignItems:"center",gap:4,
            }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/></svg>
              {projectName}
            </span>
          )}
          {lastKeyUsed && (
            <span style={{fontSize:10,color:"var(--text-3)",fontFamily:"var(--font-mono)"}}>key #{lastKeyUsed}</span>
          )}
        </div>

        {/* Model picker */}
        <div style={{position:"relative"}}>
          <button
            onClick={() => setShowModelPicker(!showModelPicker)}
            style={{
              display:"flex",alignItems:"center",gap:6,
              padding:"5px 11px",borderRadius:"var(--r-sm)",
              background:"var(--bg-elevated)",border:"1px solid var(--border-hi)",
              color:"var(--text-1)",fontSize:12,fontWeight:500,
            }}
          >
            {activeModel ? (
              <>
                <span className={`tag ${activeProvider==="groq"?"tag-purple":"tag-blue"}`} style={{fontSize:9,padding:"1px 5px"}}>{activeProvider}</span>
                <span style={{maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                  {activeModel.split("/").pop()}
                </span>
              </>
            ) : (
              <span style={{color:"var(--text-3)"}}>Select model</span>
            )}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {showModelPicker && (
            <div style={{
              position:"absolute",right:0,top:"calc(100% + 6px)",
              background:"var(--bg-surface)",border:"1px solid var(--border-hi)",
              borderRadius:"var(--r-lg)",padding:"6px",zIndex:100,
              minWidth:240,maxHeight:320,overflowY:"auto",
              boxShadow:"0 8px 24px rgba(0,0,0,0.3)",
            }}>
              {allModels.length === 0 ? (
                <div style={{padding:"10px 12px",fontSize:12,color:"var(--text-3)"}}>No models — add in Settings</div>
              ) : (
                <>
                  {["openrouter","groq"].map(prov => {
                    const provModels = allModels.filter(m => m.provider===prov);
                    if (!provModels.length) return null;
                    return (
                      <div key={prov}>
                        <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:"var(--text-3)",padding:"6px 10px 4px"}}>{prov}</div>
                        {provModels.map(m => (
                          <div key={m.id}
                            className="p-row"
                            style={{padding:"7px 10px",gap:8}}
                            onClick={() => { setActiveModel(m.provider,m.id); setShowModelPicker(false); }}
                          >
                            <span className={`tag ${m.provider==="groq"?"tag-purple":"tag-blue"}`} style={{fontSize:9}}>{m.provider==="groq"?"G":"OR"}</span>
                            <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:13}}>{m.name||m.id}</span>
                            {activeModel===m.id && activeProvider===m.provider && (
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"20px 20px 8px"}}
        onClick={() => showModelPicker && setShowModelPicker(false)}>
        {messages.length === 0 && !isThinking && (
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",gap:14,color:"var(--text-3)"}}>
            <div style={{
              width:54,height:54,background:"var(--accent-bg)",borderRadius:"14px",
              display:"flex",alignItems:"center",justifyContent:"center",
              border:"1px solid var(--border-hi)",
            }}>
              <span style={{fontFamily:"var(--font-mono)",fontWeight:700,color:"var(--accent)",fontSize:20}}>O</span>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:16,fontWeight:600,color:"var(--text-2)",marginBottom:6}}>OpenCode</div>
              <div style={{fontSize:13,color:"var(--text-3)",maxWidth:320,lineHeight:1.8}}>
                {!activeModel
                  ? "Add an API key and select a model in Settings."
                  : "Ask me to build, fix, explain, or review your code."}
              </div>
            </div>
            {activeModel && (
              <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center",maxWidth:440}}>
                {["Create a React todo app","Build an Express REST API","Write a Python scraper","Fix bugs in my project","Create a landing page"].map(s => (
                  <button key={s} className="btn btn-secondary" style={{fontSize:12}} onClick={() => setInput(s)}>{s}</button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.map((m,i) => <Message key={m.id||i} msg={m}/>)}
        {isThinking && <Thinking/>}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{padding:"12px 16px",borderTop:"1px solid var(--border)",background:"var(--bg-surface)",flexShrink:0}}>
        <div style={{
          display:"flex",gap:8,alignItems:"flex-end",
          background:"var(--bg-elevated)",border:"1px solid var(--border-hi)",
          borderRadius:"var(--r-lg)",padding:"8px 10px",
          transition:"border-color 0.15s",
        }}>
          <textarea ref={taRef} value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();} }}
            onFocus={e => e.target.parentElement.style.borderColor="var(--accent)"}
            onBlur={e => e.target.parentElement.style.borderColor="var(--border-hi)"}
            placeholder={isThinking?"Thinking…":"Ask OpenCode anything… (Enter to send, Shift+Enter for new line)"}
            disabled={isThinking}
            rows={1}
            style={{
              flex:1,background:"transparent",border:"none",resize:"none",
              color:"var(--text-1)",fontSize:14,lineHeight:1.6,
              maxHeight:140,outline:"none",padding:0,overflowY:"auto",
              fontFamily:"var(--font)",
            }}
            onInput={e => { e.target.style.height="auto"; e.target.style.height=Math.min(e.target.scrollHeight,140)+"px"; }}
          />
          <button onClick={send} disabled={!input.trim()||isThinking}
            style={{
              width:32,height:32,borderRadius:"var(--r-sm)",flexShrink:0,
              background:input.trim()&&!isThinking?"var(--accent)":"var(--bg-hover)",
              color:input.trim()&&!isThinking?"#fff":"var(--text-3)",
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all 0.15s",
            }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
