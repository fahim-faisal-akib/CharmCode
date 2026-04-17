import React, { useState, useCallback } from "react";
import { useStore } from "../store";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { githubLight } from "@uiw/codemirror-theme-github";

// Map file extensions to CodeMirror language extensions
function getLang(filename) {
  const ext = filename?.includes(".") ? filename.split(".").pop().toLowerCase() : "";
  switch (ext) {
    case "js": case "jsx": case "mjs": case "cjs":
      return [javascript({ jsx: true })];
    case "ts": case "tsx":
      return [javascript({ jsx: true, typescript: true })];
    case "py":
      return [python()];
    case "html": case "htm":
      return [html()];
    case "css": case "scss": case "sass":
      return [css()];
    case "json":
      return [json()];
    default:
      return [];
  }
}

export default function FilesView() {
  const {
    selectedFile, selectedFileContent,
    setFileContent, saveFile, fileModified, theme,
  } = useStore();
  const [viewMode, setViewMode] = useState("edit"); // "edit" | "preview"

  const handleChange = useCallback((value) => {
    setFileContent(value);
  }, [setFileContent]);

  const editorTheme = theme === "light" ? githubLight : vscodeDark;
  const ext = selectedFile?.includes(".") ? selectedFile.split(".").pop().toLowerCase() : "";
  const isMarkdown = ext === "md";

  if (!selectedFile) {
    return (
      <div style={{
        display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
        height:"100%", gap:12, color:"var(--text-3)",
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>No file selected</div>
          <div style={{fontSize:12}}>Pick a file from the Files panel</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100vh"}}>
      {/* Header */}
      <div style={{
        height:48, padding:"0 16px",
        borderBottom:"1px solid var(--border)",
        background:"var(--bg-surface)",
        display:"flex", alignItems:"center", justifyContent:"space-between",
        flexShrink:0,
      }}>
        {/* File path + status */}
        <div style={{display:"flex", alignItems:"center", gap:10, minWidth:0}}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="var(--text-3)" strokeWidth="2" style={{flexShrink:0}}>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span style={{
            fontFamily:"var(--font-mono)", fontSize:13, color:"var(--text-1)",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
          }}>
            {selectedFile}
          </span>
          {fileModified && (
            <span className="tag tag-amber" style={{fontSize:10,flexShrink:0}}>● unsaved</span>
          )}
        </div>

        {/* Controls */}
        <div style={{display:"flex", gap:6, alignItems:"center", flexShrink:0}}>
          {/* Edit / Preview toggle for markdown */}
          {isMarkdown && (
            <div style={{
              display:"flex", background:"var(--bg-elevated)",
              border:"1px solid var(--border-hi)", borderRadius:"var(--r-sm)",
              overflow:"hidden",
            }}>
              {["edit","preview"].map(m => (
                <button key={m} onClick={() => setViewMode(m)} style={{
                  padding:"4px 10px", fontSize:12, fontWeight:500,
                  background: viewMode===m ? "var(--accent)" : "transparent",
                  color: viewMode===m ? "#fff" : "var(--text-2)",
                  border:"none", cursor:"pointer",
                }}>
                  {m.charAt(0).toUpperCase()+m.slice(1)}
                </button>
              ))}
            </div>
          )}

          {fileModified && (
            <button className="btn btn-primary"
              style={{fontSize:12, padding:"5px 14px"}}
              onClick={saveFile}>
              Save  <kbd style={{
                fontSize:10, opacity:0.8, fontFamily:"var(--font-mono)",
                background:"rgba(255,255,255,0.15)", padding:"1px 4px",
                borderRadius:3, marginLeft:2,
              }}>Ctrl+S</kbd>
            </button>
          )}
        </div>
      </div>

      {/* Editor / Preview */}
      <div style={{flex:1, overflow:"hidden", display:"flex", flexDirection:"column"}}>
        {viewMode === "preview" && isMarkdown ? (
          <div style={{
            flex:1, overflow:"auto", padding:"24px 32px",
            background:"var(--bg-base)",
          }}>
            <div className="md" style={{maxWidth:720, lineHeight:1.8}}>
              {selectedFileContent.split("\n").map((line, i) => (
                <p key={i} style={{margin:"2px 0"}}>{line || <br/>}</p>
              ))}
            </div>
          </div>
        ) : (
          <CodeMirror
            value={selectedFileContent}
            onChange={handleChange}
            extensions={getLang(selectedFile)}
            theme={editorTheme}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              foldGutter: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              syntaxHighlighting: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              crosshairCursor: false,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              searchKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
            style={{
              flex:1,
              height:"100%",
              fontSize:13,
              fontFamily:"var(--font-mono)",
            }}
            height="100%"
          />
        )}
      </div>

      {/* Status bar */}
      <div style={{
        height:24, padding:"0 14px",
        background:"var(--bg-surface)",
        borderTop:"1px solid var(--border)",
        display:"flex", alignItems:"center", gap:16,
        flexShrink:0,
      }}>
        <span style={{fontSize:11,color:"var(--text-3)",fontFamily:"var(--font-mono)"}}>
          {ext.toUpperCase() || "TEXT"}
        </span>
        <span style={{fontSize:11,color:"var(--text-3)",fontFamily:"var(--font-mono)"}}>
          {selectedFileContent.split("\n").length} lines
        </span>
        <span style={{fontSize:11,color:"var(--text-3)",fontFamily:"var(--font-mono)"}}>
          {selectedFileContent.length} chars
        </span>
        {fileModified && (
          <span style={{fontSize:11,color:"var(--amber)",fontFamily:"var(--font-mono)",marginLeft:"auto"}}>
            Modified
          </span>
        )}
      </div>
    </div>
  );
}
