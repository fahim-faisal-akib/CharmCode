import React, { useState, useEffect } from "react";
import { useStore } from "../store";

function KeySlot({ index, value, provider, onChange, onTest }) {
  const [show, setShow] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState(null);
  const doTest = async () => {
    if (!value) return;
    setTesting(true); setResult(null);
    setResult(await onTest(value, provider));
    setTesting(false);
  };
  return (
    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}>
      <div style={{
        width:20,height:20,borderRadius:4,flexShrink:0,
        background:index===0?"var(--accent-bg)":"var(--bg-elevated)",
        border:`1px solid ${index===0?"var(--accent)":"var(--border-hi)"}`,
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:10,fontWeight:700,fontFamily:"var(--font-mono)",
        color:index===0?"var(--accent)":"var(--text-3)",
      }}>{index+1}</div>
      <div style={{flex:1,position:"relative"}}>
        <input type={show?"text":"password"}
          placeholder={index===0?(provider==="groq"?"gsk_... (required)":"sk-or-... (required)"):"backup key"}
          value={value} onChange={e=>onChange(e.target.value)}
          style={{paddingRight:44,fontSize:12,padding:"6px 42px 6px 10px"}}/>
        <button onClick={()=>setShow(!show)} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"transparent",color:"var(--text-3)",fontSize:11,padding:"0 2px"}}>
          {show?"hide":"show"}
        </button>
      </div>
      <button className="btn btn-secondary" onClick={doTest} disabled={!value||testing} style={{fontSize:11,padding:"5px 9px",flexShrink:0}}>
        {testing?"…":"Test"}
      </button>
      {result && <span className={`tag ${result.valid?"tag-green":"tag-red"}`}>{result.valid?"✓":"✗"}</span>}
    </div>
  );
}

function ModelRow({ model, isActive, provider, onActivate, onDelete }) {
  return (
    <div style={{
      display:"flex",alignItems:"center",gap:8,padding:"8px 12px",
      background:isActive?"var(--bg-active)":"var(--bg-elevated)",
      border:`1px solid ${isActive?"var(--accent)":"var(--border)"}`,
      borderRadius:"var(--r-sm)",marginBottom:5,
    }}>
      <div onClick={onActivate} style={{
        width:8,height:8,borderRadius:"50%",flexShrink:0,cursor:"pointer",
        background:isActive?"var(--accent)":"var(--border-hi)",
        border:`2px solid ${isActive?"var(--accent)":"var(--border-hi)"}`,
      }}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{model.name||model.id}</div>
        {model.name&&model.name!==model.id&&<div style={{fontSize:10,color:"var(--text-3)",fontFamily:"var(--font-mono)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{model.id}</div>}
      </div>
      {isActive && <span className={`tag ${provider==="groq"?"tag-purple":"tag-blue"}`} style={{fontSize:10}}>Active</span>}
      {!isActive && <button className="btn btn-secondary" onClick={onActivate} style={{fontSize:11,padding:"3px 8px"}}>Use</button>}
      <button className="btn btn-danger" onClick={onDelete} style={{fontSize:11,padding:"3px 8px"}}>✕</button>
    </div>
  );
}

function AddModel({ onAdd, placeholder }) {
  const [id,setId]=useState(""); const [name,setName]=useState("");
  const add=()=>{ if(!id.trim()) return; onAdd({id:id.trim(),name:name.trim()||id.trim()}); setId(""); setName(""); };
  return (
    <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
      <input type="text" placeholder={placeholder} value={id} onChange={e=>setId(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} style={{flex:2,minWidth:160,fontSize:12}}/>
      <input type="text" placeholder="Display name (optional)" value={name} onChange={e=>setName(e.target.value)} style={{flex:1,minWidth:110,fontSize:12}}/>
      <button className="btn btn-primary" onClick={add} disabled={!id.trim()} style={{fontSize:12}}>Add</button>
    </div>
  );
}

export default function SettingsView() {
  const {
    openrouterKeys,openrouterModels,groqKeys,groqModels,
    activeProvider,activeModel,theme,
    saveOpenrouterKeys,saveGroqKeys,
    saveOpenrouterModels,saveGroqModels,
    setActiveModel,setTheme,testApiKey,
  } = useStore();

  const [orKeys,setOrKeys]     = useState([...openrouterKeys]);
  const [gqKeys,setGqKeys]     = useState([...groqKeys]);
  const [orModels,setOrModels] = useState([...openrouterModels]);
  const [gqModels,setGqModels] = useState([...groqModels]);
  const [tab,setTab]           = useState("openrouter");
  const [saved,setSaved]       = useState("");

  useEffect(()=>setOrKeys([...openrouterKeys]),[openrouterKeys]);
  useEffect(()=>setGqKeys([...groqKeys]),[groqKeys]);
  useEffect(()=>setOrModels([...openrouterModels]),[openrouterModels]);
  useEffect(()=>setGqModels([...groqModels]),[groqModels]);

  const flash = msg => { setSaved(msg); setTimeout(()=>setSaved(""),2000); };

  const addOrModel  = m => { const u=[...orModels,m]; setOrModels(u); saveOpenrouterModels(u); flash("Model added"); };
  const delOrModel  = id => { const u=orModels.filter(m=>m.id!==id); setOrModels(u); saveOpenrouterModels(u); };
  const addGqModel  = m => { const u=[...gqModels,m]; setGqModels(u); saveGroqModels(u); flash("Model added"); };
  const delGqModel  = id => { const u=gqModels.filter(m=>m.id!==id); setGqModels(u); saveGroqModels(u); };

  const Tab = ({id,label}) => (
    <button onClick={()=>setTab(id)} style={{
      padding:"9px 16px",background:"transparent",border:"none",cursor:"pointer",
      borderBottom:tab===id?"2px solid var(--accent)":"2px solid transparent",
      color:tab===id?"var(--accent)":"var(--text-3)",
      fontSize:13,fontWeight:600,transition:"all 0.15s",
    }}>{label}</button>
  );

  return (
    <div style={{flex:1,overflowY:"auto",padding:"24px 28px",maxWidth:700}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
        <h1 style={{fontSize:20,fontWeight:700}}>Settings</h1>
        {saved && <span className="tag tag-green" style={{animation:"fadeIn 0.2s"}}>✓ {saved}</span>}
      </div>
      <p style={{fontSize:13,color:"var(--text-3)",marginBottom:20}}>Manage API keys, models, and preferences.</p>

      {/* Tab bar */}
      <div style={{display:"flex",borderBottom:"1px solid var(--border)",marginBottom:20}}>
        <Tab id="openrouter" label="OpenRouter"/>
        <Tab id="groq" label="Groq"/>
        <Tab id="appearance" label="Appearance"/>
      </div>

      {/* OpenRouter */}
      {tab==="openrouter" && <>
        <div className="card" style={{marginBottom:16}}>
          <div className="sec-label">API Keys — up to 5, auto-fallback if one fails</div>
          <p style={{fontSize:12,color:"var(--text-2)",marginBottom:12,lineHeight:1.7}}>
            Get keys at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{color:"var(--accent-hi)"}}>openrouter.ai/keys</a>
          </p>
          {orKeys.map((k,i)=>(
            <KeySlot key={i} index={i} value={k} provider="openrouter"
              onChange={v=>{const u=[...orKeys];u[i]=v;setOrKeys(u);}}
              onTest={testApiKey}/>
          ))}
          <button className="btn btn-primary" style={{marginTop:10,fontSize:12}} onClick={async()=>{await saveOpenrouterKeys(orKeys);flash("OpenRouter keys saved");}}>Save Keys</button>
        </div>
        <div className="card">
          <div className="sec-label">Models</div>
          <p style={{fontSize:12,color:"var(--text-2)",marginBottom:10,lineHeight:1.7}}>
            Enter model IDs from <a href="https://openrouter.ai/models" target="_blank" rel="noreferrer" style={{color:"var(--accent-hi)"}}>openrouter.ai/models</a> e.g. <code style={{fontFamily:"var(--font-mono)",background:"var(--bg-elevated)",padding:"1px 5px",borderRadius:3,fontSize:11}}>openai/gpt-4o</code>
          </p>
          <AddModel onAdd={addOrModel} placeholder="openai/gpt-4o, anthropic/claude-3.5-sonnet…"/>
          {orModels.map(m=>(
            <ModelRow key={m.id} model={m} provider="openrouter"
              isActive={activeModel===m.id&&activeProvider==="openrouter"}
              onActivate={()=>{setActiveModel("openrouter",m.id);flash("Active model set");}}
              onDelete={()=>delOrModel(m.id)}/>
          ))}
          {orModels.length===0&&<div style={{fontSize:12,color:"var(--text-3)",padding:"8px 0"}}>No models yet.</div>}
        </div>
      </>}

      {/* Groq */}
      {tab==="groq" && <>
        <div className="card" style={{marginBottom:16}}>
          <div className="sec-label">API Keys — up to 5, auto-fallback</div>
          <p style={{fontSize:12,color:"var(--text-2)",marginBottom:12,lineHeight:1.7}}>
            Free keys at <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" style={{color:"var(--purple)"}}>console.groq.com/keys</a>
          </p>
          {gqKeys.map((k,i)=>(
            <KeySlot key={i} index={i} value={k} provider="groq"
              onChange={v=>{const u=[...gqKeys];u[i]=v;setGqKeys(u);}}
              onTest={testApiKey}/>
          ))}
          <button className="btn btn-primary" style={{marginTop:10,fontSize:12,background:"var(--purple)"}} onClick={async()=>{await saveGroqKeys(gqKeys);flash("Groq keys saved");}}>Save Keys</button>
        </div>
        <div className="card">
          <div className="sec-label">Models</div>
          <p style={{fontSize:12,color:"var(--text-2)",marginBottom:10,lineHeight:1.7}}>Popular Groq models:</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
            {["llama-3.3-70b-versatile","llama3-8b-8192","mixtral-8x7b-32768","gemma2-9b-it"].map(id=>(
              <button key={id} className="btn btn-secondary" style={{fontSize:11}}
                onClick={()=>addGqModel({id,name:id})}>+ {id}</button>
            ))}
          </div>
          <AddModel onAdd={addGqModel} placeholder="llama-3.3-70b-versatile, mixtral-8x7b-32768…"/>
          {gqModels.map(m=>(
            <ModelRow key={m.id} model={m} provider="groq"
              isActive={activeModel===m.id&&activeProvider==="groq"}
              onActivate={()=>{setActiveModel("groq",m.id);flash("Active model set");}}
              onDelete={()=>delGqModel(m.id)}/>
          ))}
          {gqModels.length===0&&<div style={{fontSize:12,color:"var(--text-3)",padding:"8px 0"}}>No models yet.</div>}
        </div>
      </>}

      {/* Appearance */}
      {tab==="appearance" && (
        <div className="card">
          <div className="sec-label">Theme</div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            {[{id:"dark",label:"Dark"},{id:"light",label:"Light"},{id:"system",label:"System"}].map(t=>(
              <button key={t.id} onClick={()=>setTheme(t.id)} style={{
                flex:1,padding:"14px",borderRadius:"var(--r-lg)",
                background:theme===t.id?"var(--bg-active)":"var(--bg-elevated)",
                border:`1px solid ${theme===t.id?"var(--accent)":"var(--border-hi)"}`,
                color:theme===t.id?"var(--accent)":"var(--text-2)",
                fontSize:14,fontWeight:600,cursor:"pointer",transition:"all 0.15s",
              }}>
                {t.id==="dark"?"🌙":t.id==="light"?"☀️":"💻"} {t.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
